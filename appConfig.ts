import {
  fetchAppConfig
} from "./helper/sql/sqlUtils";
import {
copyOf,
  splitIntoArray
} from "./helper/utils/utils";
import {
  AppConfig,
  AppConfigKeyBoolean,
  AppConfigKeyArray,
  AppConfigKeyString,
  AppConfigKeyNumber
} from "./types/interfaces";

// Warning: don't allow updating the following env vars
// via db events for security reasons. These vars should
// only be updated via .env file and require app restart.
// Thus, keep them as const.
// - enableAppConfigChanges
// - enableAppConfigChangesByAdmin
// - enableAdmin
// - admins

// AppConfig
const enableAppConfigChanges: boolean =
  process?.env.ENABLE_APP_CONFIG_CHANGES === 'false' ? false : true;
const enableAppConfigChangesByAdmin: boolean =
  process?.env.ENABLE_APP_CONFIG_CHANGES_BY_ADMIN === 'false' ? false : true;
// Admin
const enableAdmin: boolean =
  process?.env.ENABLE_ADMIN === 'false' ? false : true;
const admins: string[] = splitIntoArray(process?.env?.ADMINS)

// Enabled by default
const allowNewEventsWithoutSignature: boolean =
  process?.env.ALLOW_NEW_EVENTS_WITHOUT_SIGNATURE === 'false' ? false : true;
const enableNewWeb3ActionsAll: boolean =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_ALL === 'false' ? false : true;
const enableNewWeb3ActionsPost: boolean =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_POST === 'false' ? false : true;
const enableNewWeb3ActionsReact: boolean =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_REACT === 'false' ? false : true;
const enableNewWeb3ActionsReply: boolean =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_REPLY === 'false' ? false : true;
const enableNewWeb3ActionsModerate: boolean =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_MODERATE === 'false' ? false : true;
const enableNewNostrActionsAll: boolean =
  process?.env.ENABLE_NEW_NOSTR_ACTIONS_ALL === 'false' ? false : true;
const enableNewEthereumActionsAll: boolean =
  process?.env.ENABLE_NEW_ETHEREUM_ACTIONS_ALL === 'false' ? false : true;
const enableModeration: boolean =
  process?.env.ENABLE_MODERATION === 'false' ? false : true;
const moderators: string[] = splitIntoArray(process?.env?.MODERATORS)

// Short IDs
const enableShortUrlsForWeb3Actions =
  process?.env.ENABLE_SHORT_URLS_FOR_WEB3_ACTIONS === 'false' ? false : true;
const shortUrlsLengthOfWeb3Ids: number =
  Number(process?.env?.SHORT_URLS_LENGTH_OF_WEB3_IDS) || 30;

// SPASM module is disabled by default
const enableSpasmModule: boolean =
  process?.env?.ENABLE_SPASM_MODULE === 'true' ? true : false
const enableSpasmSourcesUpdates: boolean =
  process?.env?.ENABLE_SPASM_SOURCES_UPDATES === 'true' ? true : false
const ignoreWhitelistForActionPostInSpasmModule: boolean =
  process?.env?.IGNORE_WHITELIST_FOR_ACTION_POST_IN_SPASM_MODULE === 'false' ? false : true
const ignoreWhitelistForActionReactInSpasmModule: boolean =
  process?.env?.IGNORE_WHITELIST_FOR_ACTION_REACT_IN_SPASM_MODULE === 'false' ? false : true
const ignoreWhitelistForActionReplyInSpasmModule: boolean =
  process?.env?.IGNORE_WHITELIST_FOR_ACTION_REPLY_IN_SPASM_MODULE === 'false' ? false : true

// RSS module is disabled by default
const enableRssModule: boolean =
  process.env.ENABLE_RSS_MODULE === 'true' ? true : false
const enableRssSourcesUpdates: boolean =
  process.env.ENABLE_RSS_SOURCES_UPDATES === 'true' ? true : false

// Disabled by default
const enableWhitelistForActionPost: boolean =
  process?.env?.ENABLE_WHITELIST_FOR_ACTION_POST === 'true' ? true : false;
const whitelistedForActionPost: string[] =
  splitIntoArray(process?.env?.WHITELISTED_FOR_ACTION_POST)
const enableWhitelistForActionReply: boolean =
  process?.env?.ENABLE_WHITELIST_FOR_ACTION_REPLY === 'true' ? true : false;
const whitelistedForActionReply: string[] =
  splitIntoArray(process?.env?.WHITELISTED_FOR_ACTION_REPLY)
const enableWhitelistForActionReact: boolean =
  process?.env?.ENABLE_WHITELIST_FOR_ACTION_REACT === 'true' ? true : false;
const whitelistedForActionReact: string[] =
  splitIntoArray(process?.env?.WHITELISTED_FOR_ACTION_REACT)

// Filters
const feedFiltersActivityHot: number =
  Number(process?.env?.FEED_FILTERS_ACTIVITY_HOT) || 5;
const feedFiltersActivityRising: number =
  Number(process?.env?.FEED_FILTERS_ACTIVITY_RISING) || 3;

export const updateAppConfig = async (
): Promise<string | null>  => {
  if (!enableAppConfigChanges) return null
  const appConfig: AppConfig = await fetchAppConfig()
  if (
    !appConfig || typeof(appConfig) !== "object" ||
    Array.isArray(appConfig)
  ) { return null }

  const newEnv = copyOf(env)

  // Booleans
  const updateBoolean = (key: AppConfigKeyBoolean) => {
    if (
      key in appConfig && typeof(appConfig[key]) === "boolean"
    ) { newEnv[key] = appConfig[key] }
  }
  updateBoolean("allowNewEventsWithoutSignature")
  updateBoolean("enableNewWeb3ActionsAll")
  updateBoolean("enableNewWeb3ActionsPost")
  updateBoolean("enableNewWeb3ActionsReact")
  updateBoolean("enableNewWeb3ActionsReply")
  updateBoolean("enableNewWeb3ActionsModerate")
  updateBoolean("enableNewNostrActionsAll")
  updateBoolean("enableNewEthereumActionsAll")
  updateBoolean("enableModeration")
  updateBoolean("enableShortUrlsForWeb3Actions")
  updateBoolean("enableWhitelistForActionPost")
  updateBoolean("enableWhitelistForActionReply")
  updateBoolean("enableWhitelistForActionReact")
  updateBoolean("enableSpasmModule")
  updateBoolean("enableSpasmSourcesUpdates")
  updateBoolean("enableRssModule")
  updateBoolean("enableRssSourcesUpdates")
  updateBoolean("ignoreWhitelistForActionPostInSpasmModule")
  updateBoolean("ignoreWhitelistForActionReactInSpasmModule")
  updateBoolean("ignoreWhitelistForActionReplyInSpasmModul")

  // Arrays
  const updateArray = (key: AppConfigKeyArray) => {
    if (key in appConfig) {
      if (Array.isArray(appConfig[key])) {
        newEnv[key] = appConfig[key]
      }
    }
  }
  updateArray("moderators")
  updateArray("whitelistedForActionPost")
  updateArray("whitelistedForActionReply")
  updateArray("whitelistedForActionReact")

  // Numbers
  const updateNumber = (key: AppConfigKeyNumber) => {
    if (key in appConfig) {
      if (typeof(appConfig[key]) === "number") {
        newEnv[key] = appConfig[key]
      } else if (Number(appConfig[key])) {
        newEnv[key] = Number(appConfig[key])
      }
    }
  }
  updateNumber("shortUrlsLengthOfWeb3Ids")
  updateNumber("feedFiltersActivityHot")
  updateNumber("feedFiltersActivityRising")

  // Strings
  const updateString = (key: AppConfigKeyString) => {
    if (key in appConfig) {
      if (typeof(appConfig[key]) === "string") {
        newEnv[key] = appConfig[key]
      }
    }
  }
  updateString("anotherWebsiteLink")
  updateString("ipfsLink")
  updateString("torLink")
  updateString("ipfsHttpGatewayLink")

  updateString("nostrLink")
  updateString("sessionLink")
  updateString("simplexLink")
  updateString("statusLink")
  updateString("lensLink")
  updateString("farcasterLink")
  updateString("hiveLink")
  updateString("pushLink")
  updateString("mirrorLink")
  updateString("mastodonLink")
  updateString("matrixLink")
  updateString("discordLink")
  updateString("telegramLink")
  updateString("twitterLink")
  updateString("redditLink")
  updateString("youtubeLink")
  updateString("instagramLink")
  updateString("facebookLink")
  updateString("linkedinLink")
  updateString("wikipediaLink")
  updateString("githubLink")

  updateString("nostrNpub")
  updateString("sessionName")
  updateString("matrixName")
  updateString("lensName")
  updateString("farcasterName")
  updateString("hiveName")
  updateString("pushName")
  updateString("mirrorName")
  updateString("telegramName")
  updateString("twitterName")
  updateString("redditName")
  updateString("signalNumber")
  updateString("whatsappNumber")
  updateString("xmppName")

  updateString("uniswapLink")
  updateString("sushiswapLink")
  updateString("etherscanLink")
  updateString("ethvmLink")
  updateString("coingeckoLink")
  updateString("coinmarketcapLink")
  updateString("dextoolsLink")
  updateString("dexscreenerLink")
  updateString("birdeyeLink")
  updateString("geckoterminalLink")

  updateString("extraContactInfo")

  // Reminded: don't change these keys:
  // - enableAppConfigChanges
  // - enableAppConfigChangesByAdmin
  // - enableAdmin
  // - admins
  updateEnvObject(newEnv)
  return "SUCCESS: App config updated"
}

export const loadAppConfig = updateAppConfig

const updateEnvObject = (newEnv: AppConfig) => {
  env = copyOf(newEnv)
}

export let env = {
  // can only be changed via .env file, require restart
  enableAppConfigChanges,
  enableAppConfigChangesByAdmin,
  enableAdmin,
  admins,
  // can be changed via db events without app restart
  allowNewEventsWithoutSignature,
  enableNewWeb3ActionsAll, 
  enableNewWeb3ActionsPost,
  enableNewWeb3ActionsReact,
  enableNewWeb3ActionsReply,
  enableNewWeb3ActionsModerate,
  enableNewNostrActionsAll,
  enableNewEthereumActionsAll,
  enableModeration,
  moderators,
  enableShortUrlsForWeb3Actions,
  shortUrlsLengthOfWeb3Ids,
  enableWhitelistForActionPost,
  whitelistedForActionPost,
  enableWhitelistForActionReply,
  whitelistedForActionReply,
  enableWhitelistForActionReact,
  whitelistedForActionReact,
  feedFiltersActivityHot,
  feedFiltersActivityRising,
  enableSpasmModule,
  enableSpasmSourcesUpdates,
  enableRssModule,
  enableRssSourcesUpdates,
  ignoreWhitelistForActionPostInSpasmModule,
  ignoreWhitelistForActionReactInSpasmModule,
  ignoreWhitelistForActionReplyInSpasmModule
}
