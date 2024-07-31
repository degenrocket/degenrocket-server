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

// Disabled by default
const enableWhitelistForActionPost: boolean =
  process?.env?.ENABLE_WHITELIST_FOR_ACTION_POST === 'true' ? true : false;
const whitelistedForActionPost: string[] =
  typeof(process?.env?.WHITELISTED_FOR_ACTION_POST) === 'string'
  ? process?.env?.WHITELISTED_FOR_ACTION_POST.toLowerCase().split(',')
  : [];

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
  whitelistedForActionPost
}
