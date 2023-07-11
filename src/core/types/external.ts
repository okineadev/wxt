import * as vite from 'vite';
import { Manifest } from 'webextension-polyfill';
import { UnimportOptions } from 'unimport';
import { EntrypointGroup } from '.';

export interface InlineConfig {
  root?: string;
  srcDir?: string;
  publicDir?: string;
  entrypointsDir?: string;
  configFile?: string | false;
  storeIds?: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode?: string;
  imports?: Partial<UnimportOptions>;
  browser?: TargetBrowser;
  manifestVersion?: TargetManifestVersion;
  logger?: Logger;
  vite?: Omit<vite.UserConfig, 'root' | 'configFile' | 'mode'>;
  manifest?: UserManifest | Promise<UserManifest> | UserManifestFn;
  server?: WxtDevServer;
  runner?: ExtensionRunnerConfig;
}

export interface WxtInlineViteConfig
  extends Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode' | 'build'> {
  build?: Omit<vite.BuildOptions, 'outDir'>;
}

export interface BuildOutput {
  manifest: Manifest.WebExtensionManifest;
  publicAssets: vite.Rollup.OutputAsset[];
  steps: BuildStepOutput[];
}

export interface BuildStepOutput {
  entrypoints: EntrypointGroup;
  chunks: (vite.Rollup.OutputChunk | vite.Rollup.OutputAsset)[];
}

export interface WxtDevServer extends vite.ViteDevServer {
  /**
   * Ex: `3000`
   */
  port: number;
  /**
   * Ex: `"localhost"`
   */
  hostname: string;
  /**
   * Ex: `"http://localhost:3000"`
   */
  origin: string;
  /**
   * Stores the current build output of the server.
   */
  currentOutput: BuildOutput;
  /**
   * Start the server on the first open port.
   */
  start(): Promise<void>;
  /**
   * Tell the extension to reload by running `browser.runtime.reload`.
   */
  reloadExtension: () => void;
  /**
   * Tell an extension page to reload.
   *
   * The path is the bundle path, not the input paths, so if the input paths is
   * "src/options/index.html", you would pass "options.html" because that's where it is written to
   * in the dist directory, and where it's available at in the actual extension.
   *
   * @example
   * server.reloadPage("popup.html")
   * server.reloadPage("sandbox.html")
   */
  reloadPage: (path: string) => void;
  /**
   * Tell the extension to restart a content script.
   *
   * @param contentScript The manifest definition for a content script
   */
  reloadContentScript: (contentScript: Manifest.ContentScript) => void;
}

export type TargetBrowser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera';
export type TargetManifestVersion = 2 | 3;

export type UserConfig = Omit<InlineConfig, 'configFile'>;

export interface Logger {
  debug(...args: any[]): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  fatal(...args: any[]): void;
  success(...args: any[]): void;
}

export interface BaseEntrypoint {
  /**
   * The entrypoint's name. This is the filename or dirname without the type suffix.
   *
   * Examples:
   * - `popup.html` &rarr; `popup`
   * - `options/index.html` &rarr; `options`
   * - `named.sandbox.html` &rarr; `named`
   * - `named.sandbox/index.html` &rarr; `named`
   * - `sandbox.html` &rarr; `sandbox`
   * - `sandbox.index.html` &rarr; `sandbox`
   * - `overlay.content.ts` &rarr; `overlay`
   * - `overlay.content/index.ts` &rarr; `overlay`
   *
   * The name is used when generating an output file:
   * `<entrypoint.outputDir>/<entrypoint.name>.<ext>`
   */
  name: string;
  /**
   * Absolute path to the entrypoint's input file.
   */
  inputPath: string;
  /**
   * Absolute path to the entrypoint's output directory. Can be the`InternalConfg.outDir` or a
   * subdirectory of it.
   */
  outputDir: string;
}

export interface GenericEntrypoint extends BaseEntrypoint {
  type:
    | 'sandbox'
    | 'bookmarks'
    | 'history'
    | 'newtab'
    | 'sidepanel'
    | 'devtools'
    | 'unlisted-page'
    | 'unlisted-script';
}

export interface BackgroundEntrypoint extends BaseEntrypoint {
  type: 'background';
  options: {
    persistent?: boolean;
    type?: 'module';
  };
}

export interface ContentScriptEntrypoint extends BaseEntrypoint {
  type: 'content-script';
  options: Omit<ContentScriptDefinition, 'main'>;
}

export interface PopupEntrypoint extends BaseEntrypoint {
  type: 'popup';
  options: {
    /**
     * Defaults to "browser_action" to be equivalent to MV3's "action" key
     */
    mv2Key?: 'browser_action' | 'page_action';
    defaultIcon?: Record<string, string>;
    defaultTitle?: string;
  };
}

export interface OptionsEntrypoint extends BaseEntrypoint {
  type: 'options';
  options: {
    openInTab?: boolean;
    browserStyle?: boolean;
    chromeStyle?: boolean;
  };
}

export type Entrypoint =
  | GenericEntrypoint
  | BackgroundEntrypoint
  | ContentScriptEntrypoint
  | PopupEntrypoint
  | OptionsEntrypoint;

export type OnContentScriptStopped = (cb: () => void) => void;

export interface ContentScriptDefinition {
  matches: string[];
  runAt?: 'document_start' | 'document_end' | 'document_idle';
  matchAboutBlank?: boolean;
  matchOriginAsFallback?: boolean;
  world?: 'ISOLATED' | 'MAIN';
  main(): void | Promise<void>;
}

export interface BackgroundScriptDefintition {
  type?: 'module';
  main(): void;
}

/**
 * Manifest customization available in the `wxt.config.ts` file. Any missing fields like "name"
 * and "version" are managed automatically, and don't need to be listed here.
 */
export type UserManifest = Omit<
  Manifest.WebExtensionManifest,
  | 'action'
  | 'background'
  | 'browser_action'
  | 'chrome_url_overrides'
  | 'content_scripts'
  | 'description'
  | 'devtools_page'
  | 'manifest_version'
  | 'name'
  | 'options_page'
  | 'options_ui'
  | 'sandbox'
  | 'page_action'
  | 'popup'
  | 'short_name'
  | 'sidepanel'
  | 'sidebar_action'
  | 'version'
  | 'version_name'
>;

export type UserManifestFn = (
  env: ConfigEnv,
) => UserManifest | Promise<UserManifest>;

export interface ConfigEnv {
  mode: string;
  command: 'build' | 'serve';
  /**
   * Browser passed in from the CLI
   */
  browser: TargetBrowser;
  /**
   * Manifest version passed in from the CLI
   */
  manifestVersion: 2 | 3;
}

/**
 * Configure how the browser starts up.
 */
export interface ExtensionRunnerConfig {
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#browser-console
   */
  openConsole?: boolean;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#devtools
   */
  openDevtools?: boolean;
  /**
   * List of browser names and the binary that should be used to open the browser.
   */
  binaries?: {
    /**
     * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-binary
     */
    chrome?: string;
    /**
     * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-binary
     */
    edge?: string;
    /**
     * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-binary
     */
    opera?: string;
    /**
     * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox
     */
    firefox?:
      | 'firefox'
      | 'beta'
      | 'nightly'
      | 'deved'
      | 'firefoxdeveloperedition'
      | string;
  };
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox-profile
   */
  firefoxProfile?: string;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-profile
   */
  chromiumProfile?: string;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#pref
   */
  firefoxPrefs?: Record<string, string>;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args
   */
  firefoxArgs?: string[];
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args
   */
  chromiumArgs?: string[];
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#start-url
   */
  startUrls?: string[];
}