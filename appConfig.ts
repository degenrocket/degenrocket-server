// Enabled by default
const allowNewEventsWithoutSignature =
  process?.env.ALLOW_NEW_EVENTS_WITHOUT_SIGNATURE === 'false' ? false : true;
const enableNewWeb3ActionsAll =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_ALL === 'false' ? false : true;
const enableNewWeb3ActionsPost =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_POST === 'false' ? false : true;
const enableNewWeb3ActionsReact =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_REACT === 'false' ? false : true;
const enableNewWeb3ActionsReply =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_REPLY === 'false' ? false : true;
const enableNewWeb3ActionsModerate =
  process?.env.ENABLE_NEW_WEB3_ACTIONS_MODERATE === 'false' ? false : true;
const enableNewNostrActionsAll =
  process?.env.ENABLE_NEW_NOSTR_ACTIONS_ALL === 'false' ? false : true;
const enableNewEthereumActionsAll =
  process?.env.ENABLE_NEW_ETHEREUM_ACTIONS_ALL === 'false' ? false : true;
const enableModeration =
  process?.env.ENABLE_MODERATION === 'false' ? false : true;
const moderators: string[] =
  typeof(process?.env?.MODERATORS) === "string"
  ? process?.env?.MODERATORS.toLowerCase().split(',')
  : [];

// SPASM module is disabled by default
const enableSpasmModule: boolean = process?.env?.ENABLE_SPASM_MODULE === 'true' ? true : false
const enableSpasmSourcesUpdates: boolean = process?.env?.ENABLE_SPASM_SOURCES_UPDATES === 'true' ? true : false
const ignoreWhitelistForActionPostInSpasmModule: boolean = process?.env?.IGNORE_WHITELIST_FOR_ACTION_POST_IN_SPASM_MODULE === 'false' ? false : true
const ignoreWhitelistForActionReactInSpasmModule: boolean = process?.env?.IGNORE_WHITELIST_FOR_ACTION_REACT_IN_SPASM_MODULE === 'false' ? false : true
const ignoreWhitelistForActionReplyInSpasmModule: boolean = process?.env?.IGNORE_WHITELIST_FOR_ACTION_REPLY_IN_SPASM_MODULE === 'false' ? false : true

// RSS module is disabled by default
const enableRssModule: boolean = process.env.ENABLE_RSS_MODULE === 'true' ? true : false
const enableRssSourcesUpdates: boolean = process.env.ENABLE_RSS_SOURCES_UPDATES === 'true' ? true : false

// Disabled by default
const enableWhitelistForActionPost: boolean =
  process?.env?.ENABLE_WHITELIST_FOR_ACTION_POST === 'true' ? true : false;
const whitelistedForActionPost: string[] =
  typeof(process?.env?.WHITELISTED_FOR_ACTION_POST) === 'string'
  ? process?.env?.WHITELISTED_FOR_ACTION_POST.toLowerCase().split(',')
  : [];

// Filters
const feedFiltersActivityHot: number =
  Number(process?.env?.FEED_FILTERS_ACTIVITY_HOT) || 5;
const feedFiltersActivityRising: number =
  Number(process?.env?.FEED_FILTERS_ACTIVITY_RISING) || 3;

export const env = {
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
  enableWhitelistForActionPost,
  whitelistedForActionPost,
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
