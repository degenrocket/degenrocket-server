import {
  DmpEvent,
  DmpEventSignedClosed,
  DmpEventSignedOpened,
  NostrSpasmEventSignedOpened,
  Post,
  SpasmEventV0,
  SpasmEventV2
} from "../../types/interfaces"
import {
  toBeTimestamp
} from "../utils/utils"

// =================
// DegenRocket only:

// Action: post
export const validDmpActionPost: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T17:51:04.825Z","action":"post","target":"","title":"new title","text":"new content","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpActionPostSignedClosed: DmpEventSignedClosed ={
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x104caef85aa79d92e2333e71331b5ccb00bfb0ca5e228d72887431df27f9170d437498cd9e1a7e44d1e8044ed38927b6bd09b1feb158bcad5e7a2a0cbf58aa7d1c",
  signedString: JSON.stringify(validDmpActionPost)
}

export const validDmpActionPostDuplicate: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T17:51:18.568Z","action":"post","target":"","title":"new title","text":"new content","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpActionPostSignedClosedDuplicate: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x3d047bd2c5948be7f0ec07bd1212d0e6f136cb63f07eb1cc545565885b203dbc18a7a35f340812bb9d52e4e99168b0b0f9873f23be58bb65c7c8925350dd02921b",
  signedString: JSON.stringify(validDmpActionPostDuplicate)
}

export const validDmpActionPostDiffSigner: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:59:52.908Z","action":"post","target":"","title":"new title","text":"new content","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpActionPostDiffSignerSignedClosed: DmpEventSignedClosed ={
  signer: "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
  signature: "0x0939bd143f56c37a24e246f18472db16d651f2fbea0c8771e25d040283bedf1720c48d25b82fd89268ec5959278d923226abb5d495e7962f74358ed1be1082381c",
  signedString: JSON.stringify(validDmpActionPostDiffSigner)
}

// Action: react (Upvote)
export const validDmpReactionUpvote: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T17:56:53.631Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"upvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionUpvoteSignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81c",
  signedString: JSON.stringify(validDmpReactionUpvote)
}

export const invalidDmpReactionUpvoteSignedClosedWrongSignature: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81d",
  signedString: JSON.stringify(validDmpReactionUpvote)
}

export const validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2: SpasmEventV2 = {
  "type": "SpasmEventV2",
  "siblings": [
    {
      "type": "SiblingDmpSignedV2",
      "protocol": {
        "name": "dmp",
        "version": "0.1.0"
      },
      "signedString": "{\"version\":\"dmp_v0.1.0\",\"time\":\"2024-07-21T17:56:53.631Z\",\"action\":\"react\",\"target\":\"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b\",\"title\":\"\",\"text\":\"upvote\",\"license\":\"SPDX-License-Identifier: CC0-1.0\"}",
      "signatures": [
        {
          "value": "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81c",
          "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ],
      "ids": [
        {
          "value": "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81c",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ]
    }
  ],
  "action": "react",
  "content": "upvote",
  "license": "SPDX-License-Identifier: CC0-1.0",
  "timestamp": 1721584613631,
  "parent": {
    "ids": [
      {
        "value": "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
        "format": {
          "name": "ethereum-sig"
        }
      }
    ]
  },
  "authors": [
    {
      "addresses": [
        {
          "value": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-pubkey"
          },
          "verified": true
        }
      ]
    }
  ],
  "ids": [
    {
      "value": "spasmid014ac6a3accae06b3a6bb659260ebf2f6634f7f97a6846ced3ae937c203d86e162",
      "format": {
        "name": "spasmid",
        "version": "01"
      }
    },
    {
      "value": "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81c",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ],
  "signatures": [
    {
      "value": "0xc89fb811045b2c663515ca0ff05d0f141ff37aee12956fb93b9ee4748bfce50d0480b0b77183eee28836b702ef07e635c9266219b8a6540825a7467a7f4acdb81c",
      "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ]
}

export const validDmpReactionUpvoteDuplicate: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T17:57:00.255Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"upvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionUpvoteSignedClosedDuplicate: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x30ee6e057c10ccf5b565809eec381611ca342902087d883df8f7539494ca0b0b5e07492412950d9b423f1774a138bb1a68a627e9575f6592fab0a615d7c9242f1b",
  signedString: JSON.stringify(validDmpReactionUpvoteDuplicate)
}

export const validDmpReactionUpvoteSignedClosedDuplicateConvertedToSpasmEventV2: SpasmEventV2 = {
  "type": "SpasmEventV2",
  "siblings": [
    {
      "type": "SiblingDmpSignedV2",
      "protocol": {
        "name": "dmp",
        "version": "0.1.0"
      },
      "signedString": "{\"version\":\"dmp_v0.1.0\",\"time\":\"2024-07-21T17:57:00.255Z\",\"action\":\"react\",\"target\":\"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b\",\"title\":\"\",\"text\":\"upvote\",\"license\":\"SPDX-License-Identifier: CC0-1.0\"}",
      "signatures": [
        {
          "value": "0x30ee6e057c10ccf5b565809eec381611ca342902087d883df8f7539494ca0b0b5e07492412950d9b423f1774a138bb1a68a627e9575f6592fab0a615d7c9242f1b",
          "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ],
      "ids": [
        {
          "value": "0x30ee6e057c10ccf5b565809eec381611ca342902087d883df8f7539494ca0b0b5e07492412950d9b423f1774a138bb1a68a627e9575f6592fab0a615d7c9242f1b",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ]
    }
  ],
  "action": "react",
  "content": "upvote",
  "license": "SPDX-License-Identifier: CC0-1.0",
  "timestamp": 1721584620255,
  "parent": {
    "ids": [
      {
        "value": "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
        "format": {
          "name": "ethereum-sig"
        }
      }
    ]
  },
  "authors": [
    {
      "addresses": [
        {
          "value": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-pubkey"
          },
          "verified": true
        }
      ]
    }
  ],
  "ids": [
    {
      "value": "spasmid01d745820bf1f4c6e12a24fca0169a2f06351da7af204007141f9f8df83521c8f7",
      "format": {
        "name": "spasmid",
        "version": "01"
      }
    },
    {
      "value": "0x30ee6e057c10ccf5b565809eec381611ca342902087d883df8f7539494ca0b0b5e07492412950d9b423f1774a138bb1a68a627e9575f6592fab0a615d7c9242f1b",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ],
  "signatures": [
    {
      "value": "0x30ee6e057c10ccf5b565809eec381611ca342902087d883df8f7539494ca0b0b5e07492412950d9b423f1774a138bb1a68a627e9575f6592fab0a615d7c9242f1b",
      "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ]
}

export const validDmpReactionUpvoteDiffParent: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:12:44.319Z","action":"react","target":"0x73d634bb88a9d14fe486b9cdd4c61d1f11bb0a1b200453daf912eff99144ad635b5c4fd25cb06ce24b61594cee90a50c2c46496665a66b8630befd660831560d1b","title":"","text":"upvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionUpvoteDiffParentSignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x15a382e9a0f739daedc77a11662a4b8b109754fd6f17a9f6b98cdef3f94e690d3eaef91c47ec2997e685a1c73fdf4d8a0b0df1a997adb01bf67c87b9c81080cf1b",
  signedString: JSON.stringify(validDmpReactionUpvoteDiffParent)
}

export const validDmpReactionUpvoteDiffParentSignedClosedConvertedToSpasmEventV2: SpasmEventV2 = {
  "type": "SpasmEventV2",
  "siblings": [
    {
      "type": "SiblingDmpSignedV2",
      "protocol": {
        "name": "dmp",
        "version": "0.1.0"
      },
      "signedString": "{\"version\":\"dmp_v0.1.0\",\"time\":\"2024-07-21T18:12:44.319Z\",\"action\":\"react\",\"target\":\"0x73d634bb88a9d14fe486b9cdd4c61d1f11bb0a1b200453daf912eff99144ad635b5c4fd25cb06ce24b61594cee90a50c2c46496665a66b8630befd660831560d1b\",\"title\":\"\",\"text\":\"upvote\",\"license\":\"SPDX-License-Identifier: CC0-1.0\"}",
      "signatures": [
        {
          "value": "0x15a382e9a0f739daedc77a11662a4b8b109754fd6f17a9f6b98cdef3f94e690d3eaef91c47ec2997e685a1c73fdf4d8a0b0df1a997adb01bf67c87b9c81080cf1b",
          "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ],
      "ids": [
        {
          "value": "0x15a382e9a0f739daedc77a11662a4b8b109754fd6f17a9f6b98cdef3f94e690d3eaef91c47ec2997e685a1c73fdf4d8a0b0df1a997adb01bf67c87b9c81080cf1b",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ]
    }
  ],
  "action": "react",
  "content": "upvote",
  "license": "SPDX-License-Identifier: CC0-1.0",
  "timestamp": 1721585564319,
  "parent": {
    "ids": [
      {
        "value": "0x73d634bb88a9d14fe486b9cdd4c61d1f11bb0a1b200453daf912eff99144ad635b5c4fd25cb06ce24b61594cee90a50c2c46496665a66b8630befd660831560d1b",
        "format": {
          "name": "ethereum-sig"
        }
      }
    ]
  },
  "authors": [
    {
      "addresses": [
        {
          "value": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
          "format": {
            "name": "ethereum-pubkey"
          },
          "verified": true
        }
      ]
    }
  ],
  "ids": [
    {
      "value": "spasmid01786332d08cad98579232b3b87d0cf877d349c6c6957ca595ca7019622df881cb",
      "format": {
        "name": "spasmid",
        "version": "01"
      }
    },
    {
      "value": "0x15a382e9a0f739daedc77a11662a4b8b109754fd6f17a9f6b98cdef3f94e690d3eaef91c47ec2997e685a1c73fdf4d8a0b0df1a997adb01bf67c87b9c81080cf1b",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ],
  "signatures": [
    {
      "value": "0x15a382e9a0f739daedc77a11662a4b8b109754fd6f17a9f6b98cdef3f94e690d3eaef91c47ec2997e685a1c73fdf4d8a0b0df1a997adb01bf67c87b9c81080cf1b",
      "pubkey": "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ]
}

export const validDmpReactionUpvoteDiffSigner: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T19:02:49.569Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"upvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionUpvoteDiffSignerSignedClosed: DmpEventSignedClosed ={
  signer: "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
  signature: "0x97d640dd3c7ffdced2e8efebcbf0d838a39cfcccb78b6d8c7c310f7c28aa731f65da60b9451d287696c8242ddbbe62e422c913c30f227397b18796d5cfc4e2091b",
  signedString: JSON.stringify(validDmpReactionUpvoteDiffSigner)
}

export const validDmpReactionUpvoteDiffSignerSignedClosedConvertedToSpasmEventV2: SpasmEventV2 = {
  "type": "SpasmEventV2",
  "siblings": [
    {
      "type": "SiblingDmpSignedV2",
      "protocol": {
        "name": "dmp",
        "version": "0.1.0"
      },
      "signedString": "{\"version\":\"dmp_v0.1.0\",\"time\":\"2024-07-21T19:02:49.569Z\",\"action\":\"react\",\"target\":\"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b\",\"title\":\"\",\"text\":\"upvote\",\"license\":\"SPDX-License-Identifier: CC0-1.0\"}",
      "signatures": [
        {
          "value": "0x97d640dd3c7ffdced2e8efebcbf0d838a39cfcccb78b6d8c7c310f7c28aa731f65da60b9451d287696c8242ddbbe62e422c913c30f227397b18796d5cfc4e2091b",
          "pubkey": "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ],
      "ids": [
        {
          "value": "0x97d640dd3c7ffdced2e8efebcbf0d838a39cfcccb78b6d8c7c310f7c28aa731f65da60b9451d287696c8242ddbbe62e422c913c30f227397b18796d5cfc4e2091b",
          "format": {
            "name": "ethereum-sig"
          }
        }
      ]
    }
  ],
  "action": "react",
  "content": "upvote",
  "license": "SPDX-License-Identifier: CC0-1.0",
  "timestamp": 1721588569569,
  "parent": {
    "ids": [
      {
        "value": "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
        "format": {
          "name": "ethereum-sig"
        }
      }
    ]
  },
  "authors": [
    {
      "addresses": [
        {
          "value": "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
          "format": {
            "name": "ethereum-pubkey"
          },
          "verified": true
        }
      ]
    }
  ],
  "ids": [
    {
      "value": "spasmid0107902d8a1840e45e2480d0ba116555f596703795d46289884dc232715332f3de",
      "format": {
        "name": "spasmid",
        "version": "01"
      }
    },
    {
      "value": "0x97d640dd3c7ffdced2e8efebcbf0d838a39cfcccb78b6d8c7c310f7c28aa731f65da60b9451d287696c8242ddbbe62e422c913c30f227397b18796d5cfc4e2091b",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ],
  "signatures": [
    {
      "value": "0x97d640dd3c7ffdced2e8efebcbf0d838a39cfcccb78b6d8c7c310f7c28aa731f65da60b9451d287696c8242ddbbe62e422c913c30f227397b18796d5cfc4e2091b",
      "pubkey": "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
      "format": {
        "name": "ethereum-sig"
      }
    }
  ]
}

// Action: react (downvote)
export const validDmpReactionDownvote: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:03:21.355Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"downvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionDownvoteSignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x21bdb9aba55c01b8de6d197fc82bc9207f645c42bbae495292d465dcb1a2c26204460e8063b97b37a35594a5d31ccda0cd54ab80156a321a07b6ce16230d4a6e1b",
  signedString: JSON.stringify(validDmpReactionDownvote)
}

export const validDmpReactionDownvoteDuplicate: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:03:28.717Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"downvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionDownvoteSignedClosedDuplicate: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xbd65934dfd7ff98bdd28695444eb34319eb4a6d84ab1ce7162adb07946ba0ca37c0207070b62a8ccae15ae1a167bbd1ed15ab8619df8d42bb10f849bc47099051c",
  signedString: JSON.stringify(validDmpReactionDownvoteDuplicate)
}

export const validDmpReactionDownvoteDiffParent: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:15:59.910Z","action":"react","target":"0x73d634bb88a9d14fe486b9cdd4c61d1f11bb0a1b200453daf912eff99144ad635b5c4fd25cb06ce24b61594cee90a50c2c46496665a66b8630befd660831560d1b","title":"","text":"downvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionDownvoteDiffParentSignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xff01b448dfbd61c2c758fd81a7778e068f588d22e393ff5069cd6561d56c1b2039ce15ff595f21ea0496fdfd05e3a044187d681d20309c7304a06370417fa7711c",
  signedString: JSON.stringify(validDmpReactionDownvoteDiffParent)
}

export const validDmpReactionDownvoteDiffSigner: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T19:02:52.042Z","action":"react","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"downvote","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReactionDownvoteDiffSignerSignedClosed: DmpEventSignedClosed ={
  signer: "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
  signature: "0xea040a76e0e2367611598c41bcad002d363f37016117ec8c407210d389bf55c90f6329d7a405fa96ab5b0fa04cb90cf4c4b2653bef36ed7e926ae7aa41e2a7e71b",
  signedString: JSON.stringify(validDmpReactionDownvoteDiffSigner)
}

// Action: reply
export const validDmpReply: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:08:43.137Z","action":"reply","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"new comment","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReplySignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xfcb6da6975c0905353695fe4632c285aca664e1489c99c41b53505745c37b2f60d6fd0f657f22f0939ac63661c894ef27e837d74f1d1e4826f04e8f2dafd49ed1b",
  signedString: JSON.stringify(validDmpReply)
}

export const validDmpReplyDuplicate: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:08:57.896Z","action":"reply","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"new comment","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReplySignedClosedDuplicate: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0xa239b3449814ba999bb6955f7a111b039c410cde8f85b867345cc227bfeb300a20ee53d05f8c76bb1c76d2c7d98e87547b99f6ced3d4f19a3e79d41341bd63c21c",
  signedString: JSON.stringify(validDmpReplyDuplicate)
}

export const validDmpReplyDiffParent: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T18:18:21.516Z","action":"reply","target":"0x73d634bb88a9d14fe486b9cdd4c61d1f11bb0a1b200453daf912eff99144ad635b5c4fd25cb06ce24b61594cee90a50c2c46496665a66b8630befd660831560d1b","title":"","text":"new comment","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReplyDiffParentSignedClosed: DmpEventSignedClosed = {
  signer: "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
  signature: "0x51a25fd48146e9616d321543dc28e354302f87e5adeb49f4bc04d61bbfda463c4ec0caf3d723ad4108ce4799e79e8f1fac15d6d5382efc5eca413098a48209701c",
  signedString: JSON.stringify(validDmpReply)
}

export const validDmpReplyDiffSigner: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-21T19:05:39.872Z","action":"reply","target":"0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b","title":"","text":"new comment","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpReplyDiffSignerSignedClosed: DmpEventSignedClosed = {
  signer: "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
  signature: "0xe48d7aa2c2c25d5dc487b6c5deb9a2c733f4ef9e0038f76c6084f11cf061f560788edfe76a5af25263919283ac46a070e4a381191dc358266dd777b00a37a5c51c",
  signedString: JSON.stringify(validDmpReplyDiffSigner)
}

// Action: moderate
// "spasmid01fe89377ff82917af6ee09764217cee382e9ff7e0b91881eb7d9bce9e4fa8ff43"
export const moderateDeleteValidDmpReply: NostrSpasmEventSignedOpened = {"kind":1,"created_at":1721704891,"tags":[["license","SPDX-License-Identifier: CC0-1.0"],["spasm_version","1.0.0"],["spasm_action","moderate"],["spasm_target","0xfcb6da6975c0905353695fe4632c285aca664e1489c99c41b53505745c37b2f60d6fd0f657f22f0939ac63661c894ef27e837d74f1d1e4826f04e8f2dafd49ed1b"]],"content":"delete","pubkey":"b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81","id":"840fcb6edbcf07b6ee065ac7d36b8961f41579a7edbd4e258905af6da3e8ad15","sig":"d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc"}

export const validNostrSpasmModerateEvent = moderateDeleteValidDmpReply

// "spasmid01fe89377ff82917af6ee09764217cee382e9ff7e0b91881eb7d9bce9e4fa8ff43"
export const moderateDeleteValidDmpReplyConvertedToSpasmEventV2: SpasmEventV2 = {"action": "moderate", "authors": [{"addresses": [{"format": {"name": "nostr-hex"}, "value": "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81", "verified": true}]}], "content": "delete", "ids": [{"format": {"name": "spasmid", "version": "01"}, "value": "spasmid01fe89377ff82917af6ee09764217cee382e9ff7e0b91881eb7d9bce9e4fa8ff43"}, {"format": {"name": "nostr-hex"}, "value": "840fcb6edbcf07b6ee065ac7d36b8961f41579a7edbd4e258905af6da3e8ad15"}, {"format": {"name": "nostr-sig"}, "value": "d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc"}], "license": "SPDX-License-Identifier: CC0-1.0", "parent": {"ids": [{"format": {"name": "ethereum-sig"}, "value": "0xfcb6da6975c0905353695fe4632c285aca664e1489c99c41b53505745c37b2f60d6fd0f657f22f0939ac63661c894ef27e837d74f1d1e4826f04e8f2dafd49ed1b"}]}, "siblings": [{"ids": [{"format": {"name": "nostr-hex"}, "value": "840fcb6edbcf07b6ee065ac7d36b8961f41579a7edbd4e258905af6da3e8ad15"}, {"format": {"name": "nostr-sig"}, "value": "d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc"}], "originalObject": {"content": "delete", "created_at": 1721704891, "id": "840fcb6edbcf07b6ee065ac7d36b8961f41579a7edbd4e258905af6da3e8ad15", "kind": 1, "pubkey": "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81", "sig": "d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc", "tags": [["license", "SPDX-License-Identifier: CC0-1.0"], ["spasm_version", "1.0.0"], ["spasm_action", "moderate"], ["spasm_target", "0xfcb6da6975c0905353695fe4632c285aca664e1489c99c41b53505745c37b2f60d6fd0f657f22f0939ac63661c894ef27e837d74f1d1e4826f04e8f2dafd49ed1b"]]}, "protocol": {"extraSpasmFieldsVersion": "1.0.0", "hasExtraSpasmFields": true, "name": "nostr"}, "signatures": [{"format": {"name": "nostr-sig"}, "pubkey": "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81", "value": "d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc"}], "type": "SiblingNostrSpasmSignedV2"}], "signatures": [{"format": {"name": "nostr-sig"}, "pubkey": "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81", "value": "d89bfa7fc6eff72b621a7336046c76b888cefb189da6711532f8ca6374ba638b7ca31d9c014cda5c8a59bf7599a3cf79c71c9053bbba7e1c4589fd2ffc0cf8cc"}], "timestamp": 1721704891, "type": "SpasmEventV2"}

// ==============
// From spasm.js:
export const validDmpEvent: DmpEvent = {
  version: "dmp_v0.0.1",
  time: "2022-01-01T22:04:46.178Z",
  action: "post",
  target: "",
  title: "genesis",
  text: "not your keys, not your words",
  license: "MIT"
}

export const validDmpEventSignedClosed: DmpEventSignedClosed = {
  signer: '0xf8553015220a857eda377a1e903c9e5afb3ac2fa',
  signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b',
  // signedString: JSON.stringify(validDmpEvent)
  signedString: "{\"version\":\"dmp_v0.0.1\",\"time\":\"2022-01-01T22:04:46.178Z\",\"action\":\"post\",\"target\":\"\",\"title\":\"genesis\",\"text\":\"not your keys, not your words\",\"license\":\"MIT\"}"
}

export const validDmpEventSignedOpened: DmpEventSignedOpened = {
  ...validDmpEventSignedClosed,
  signedObject: validDmpEvent
}

export const validDmpEventConvertedToSpasmEventV2: SpasmEventV2 = {
  type: "SpasmEventV2",
  action: "post",
  ids: [
    {
      value: "spasmid0103086d8c9881aa566b755d0b50fc0c80ab4362224860ee21859e658f64cca4c3",
      format: {
        name: "spasmid",
        version: "01"
      }
    }
  ],
  title: "genesis",
  content: "not your keys, not your words",
  timestamp: 1641074686178,
  license: "MIT",
  siblings: [
    {
      type: "SiblingDmpV2",
      protocol: {
        name: "dmp",
        version: "0.0.1"
      },
      signedString: JSON.stringify(validDmpEvent),
    }
  ]
}

export const validDmpEventSignedClosedConvertedToSpasmV2: SpasmEventV2 = {
  type: "SpasmEventV2",
  action: "post",
  title: "genesis",
  content: "not your keys, not your words",
  timestamp: 1641074686178,
  authors: [
    {
      addresses: [
        {
          value: "0xf8553015220a857eda377a1e903c9e5afb3ac2fa",
          format: { name: "ethereum-pubkey" },
          verified: true
        }
      ]
    }
  ],
  license: "MIT",
  ids: [
    {
      value: "spasmid01192d1f9994bf436f50841459d0a43c0de13ef4aaa5233827bdfe2ea2bc030d6f",
      format: {
        name: "spasmid",
        version: "01"
      }
    },
    {
      value: "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
      format: { name: "ethereum-sig", }
    }
  ],
  signatures: [
    {
      value: "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
      pubkey: "0xf8553015220a857eda377a1e903c9e5afb3ac2fa",
      format: { name: "ethereum-sig" }
    }
  ],
  siblings: [
    {
      type: "SiblingDmpSignedV2",
      protocol: {
        name: "dmp",
        version: "0.0.1"
      },
      signedString: JSON.stringify(validDmpEvent),
      ids: [
        {
          value: "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
          format: { name: "ethereum-sig" }
        }
      ],
      signatures: [
        {
          value: "0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b",
          pubkey: "0xf8553015220a857eda377a1e903c9e5afb3ac2fa",
          format: { name: "ethereum-sig" }
        }
      ]
    }
  ]
}

export const validDmpEventSignedOpenedConvertedToSpasmV2: SpasmEventV2 = {
  ...validDmpEventSignedClosedConvertedToSpasmV2,
}

export const validPostWithRssItem: Post = {
  id: 18081,
  guid: "https://forum.degenrocket.space/?l=terraforming",
  source: "degenrocket.space",
  author: "stablepony",
  tickers: "cookies",
  title: "To the Moon!",
  url: "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
  description: "Tornado is coming back! Roger that! Starting the engine...",
  pubdate: "2024-03-12T20:24:04.240Z",
  category: "defi",
  tags: ["dark", "forest"],
  upvote: 3,
  downvote: null,
  bullish: 2,
  bearish: 0,
  important: 6,
  scam: 1,
  comments_count: 0,
  latest_action_added_time: null
}

export const validSpasmEventRssItemV0: SpasmEventV0 =
  validPostWithRssItem

export const validSpasmEventRssItemV0ConvertedToSpasmV2: SpasmEventV2 = {
  type: "SpasmEventV2",
  ids: [
    {
      value: "spasmid018c2de31b99295885fbc4d86ecbeaa51c006a79abe5e728493b24bd186fb752eb",
      format: {
        name: "spasmid",
        version: "01"
      }
    },
    {
      value: "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
      format: { name: "url" }
    },
    {
      value: "https://forum.degenrocket.space/?l=terraforming",
      format: { name: "guid" }
    }
  ],
  db: {
    key: 18081
  },
  action: "post",
  title: "To the Moon!",
  content: "Tornado is coming back! Roger that! Starting the engine...",
  timestamp: toBeTimestamp("2024-03-12T20:24:04.240Z"),
  authors: [
    {
      usernames: [ { value: "stablepony" } ]
    }
  ],
  categories: [ { name: "defi" } ],
  links: [
    {
      value: "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
      protocol: "https",
      origin: "https://forum.degenrocket.space",
      host: "forum.degenrocket.space",
      pathname: "/",
      search: "?b=21&t=fog&c=samourai&h=hijack",
      originalProtocolKey: "url"
    },
    {
      value: "https://forum.degenrocket.space/?l=terraforming",
      protocol: "https",
      origin: "https://forum.degenrocket.space",
      host: "forum.degenrocket.space",
      pathname: "/",
      search: "?l=terraforming",
      originalProtocolKey: "guid"
    }
  ],
  keywords: [ "dark", "forest", "cookies" ],
  source: {
    name: "degenrocket.space"
  },
  siblings: [
    {
      type: "SiblingWeb2V2",
      protocol: { name: "web2" },
      originalObject: {
        id: 18081,
        guid: "https://forum.degenrocket.space/?l=terraforming",
        source: "degenrocket.space",
        author: "stablepony",
        tickers: "cookies",
        title: "To the Moon!",
        url: "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
        description: "Tornado is coming back! Roger that! Starting the engine...",
        pubdate: "2024-03-12T20:24:04.240Z",
        category: "defi",
        tags: ["dark", "forest"],
        upvote: 3,
        downvote: null,
        bullish: 2,
        bearish: 0,
        important: 6,
        scam: 1,
        comments_count: 0,
        latest_action_added_time: null
      },
      ids: [
        {
          value: "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
          format: { name: "url" }
        },
        {
          value: "https://forum.degenrocket.space/?l=terraforming",
          format: { name: "guid" }
        }
      ]
    }
  ],
  stats: [
    {
      action: "react",
      contents: [
        {
          value: "upvote",
          total: 3
        },
        // {
        //   value: "downvote",
        //   total: 0
        // },
        {
          value: "bullish",
          total: 2
        },
        {
          value: "bearish",
          total: 0
        },
        {
          value: "important",
          total: 6
        },
        {
          value: "scam",
          total: 1
        },
      ]
    },
    {
      action: "reply",
      total: 0
    }
  ]
}

export const validDmpActionPostWithMaliciousHtmlTags: DmpEvent = { "version":"dmp_v0.1.0","time":"2024-07-25T19:37:07.991Z","action":"post","target":"","title":"Post with malicious HTML tags","text":"Malicious tags <img src=x onerror=alert(1)//> followed by normal text.","license":"SPDX-License-Identifier: CC0-1.0" }

export const validDmpActionPostWithMaliciousHtmlTagsSignedClosed: DmpEventSignedClosed = {
  signer: "0x9993cd68dc9826cae33cf0aac6e29702b5aa0b7a",
  signature: "0x519966fa343e3203ecea802c758d7b225d052acd140dbef889334df8e55bbc5345bfd72082b303bdaba962ccee7c446c07798c3c51a2fd63e59b3e0793770fd51c",
  signedString: JSON.stringify(validDmpActionPostWithMaliciousHtmlTags)
}

export const validDmpActionPostWithValidHtmlTags: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-25T19:42:07.900Z","action":"post","target":"","title":"Post with valid HTML tags","text":"Valid <div>HTML tags</div> followed by normal text.","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpActionPostWithValidHtmlTagsSignedClosed: DmpEventSignedClosed = {
  signer: "0x9993cd68dc9826cae33cf0aac6e29702b5aa0b7a",
  signature: "0x592794c4d5ff5aea1f7050c17f3d6e3aca9abb2d6f7ddeb0576f538522602620655d571c879ad9a930159f6392b1ac1eda8c5700ed1007b048e318669e77cb671c",
  signedString: JSON.stringify(validDmpActionPostWithValidHtmlTags)
}

export const validDmpActionPostWithValidMarkdown: DmpEvent = {"version":"dmp_v0.1.0","time":"2024-07-25T20:10:44.975Z","action":"post","target":"","title":"Post with valid markdown","text":"# Content with valid markdown\n\nIt has a very **bold** and *italic* [link](https://degenrocket.space) to the source.","license":"SPDX-License-Identifier: CC0-1.0"}

export const validDmpActionPostWithValidMarkdownSignedClosed: DmpEventSignedClosed = {
  signer: "0x9993cd68dc9826cae33cf0aac6e29702b5aa0b7a",
  signature: "0x5e68603561c9d08e3cdc898f31551c3b8b87c605cb126b4fe021f188bded7e4048e56dabc266800635cff3614208f7bc4a4f19f8f9a239df063f8c51c3d251c11b",
  signedString: JSON.stringify(validDmpActionPostWithValidMarkdown)
}

export const validRssItemWithEmoji: SpasmEventV0 = {
  "id": 936756,
  "guid": "https://medium.com/p/5b93a387639c",
  "source": "osmosis-medium",
  "category": "defi",
  "tickers": "OSMO",
  "title": "Smart Accounts on Osmosis: Redefining UX and Account Management in DeFi",
  "url": "https://medium.com/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c",
  "description": "[https://cdn-images-1.medium.com/max/1024/1*GVLRlJ-vnJppv710dva-xA.png]\n\nTHE CRYPTO ECOSYSTEM ADVANCES QUICKLY WHILE THE USER EXPERIENCE (UX) OFTEN LAGS BEHIND. OSMOSIS AIMS TO BRIDGE THIS GAP WITH SMART ACCOUNTS, AN INNOVATIVE ACCOUNT AND ASSET MANAGEMENT FEATURE THAT ENHANCES USABILITY, FLEXIBILITY, AND SECURITY, WITH ROBUST MULTI-DEVICE SUPPORT FOR ON-THE-GO TRADING.\n\n\nTHE VISION FOR SMART ACCOUNTS ON OSMOSIS\n\nThe vision for Osmosis Smart Accounts is to revolutionize crypto account UX by addressing common user challenges with a solution that: streamlines user onboarding and account recovery, simplifies account management, and provides a seamless and intuitive trading experience for newcomers and experienced users alike.\n\n\nSMART ACCOUNTS: KEY FEATURES AND FUNCTIONALITIES\n\nOsmosis Smart Accounts boast several key features and functionalities:\n🧪 Automation + 1-click Trading\n🧪 Multi-Key + Multi-Device Support\n🧪 Easier Onboarding + Account Recovery\n🧪 Advanced Security Protocols\n🧪 Extensible + Composable\n\n�...",
  "pubdate": "2024-05-13T14:11:34.000Z",
  "tags": null,
  "upvote": null,
  "downvote": null,
  "bullish": null,
  "bearish": null,
  "important": null,
  "scam": null,
  "comments_count": null,
  "latest_action_added_time": null
}

export const validRssItemWithEmojiConvertedToSpasmEvent2: SpasmEventV2 = {"type":"SpasmEventV2","action":"post","title":"Smart Accounts on Osmosis: Redefining UX and Account Management in DeFi","timestamp":1715609494000,"content":"[https://cdn-images-1.medium.com/max/1024/1*GVLRlJ-vnJppv710dva-xA.png]\n\nTHE CRYPTO ECOSYSTEM ADVANCES QUICKLY WHILE THE USER EXPERIENCE (UX) OFTEN LAGS BEHIND. OSMOSIS AIMS TO BRIDGE THIS GAP WITH SMART ACCOUNTS, AN INNOVATIVE ACCOUNT AND ASSET MANAGEMENT FEATURE THAT ENHANCES USABILITY, FLEXIBILITY, AND SECURITY, WITH ROBUST MULTI-DEVICE SUPPORT FOR ON-THE-GO TRADING.\n\n\nTHE VISION FOR SMART ACCOUNTS ON OSMOSIS\n\nThe vision for Osmosis Smart Accounts is to revolutionize crypto account UX by addressing common user challenges with a solution that: streamlines user onboarding and account recovery, simplifies account management, and provides a seamless and intuitive trading experience for newcomers and experienced users alike.\n\n\nSMART ACCOUNTS: KEY FEATURES AND FUNCTIONALITIES\n\nOsmosis Smart Accounts boast several key features and functionalities:\n🧪 Automation + 1-click Trading\n🧪 Multi-Key + Multi-Device Support\n🧪 Easier Onboarding + Account Recovery\n🧪 Advanced Security Protocols\n🧪 Extensible + Composable\n\n�...","keywords":["OSMO"],"ids":[{"value":"spasmid01fc9080487349b7fc6d298d7df02e29d7d39617dd38913dfda515556eee3e156c","format":{"name":"spasmid","version":"01"}},{"value":"https://medium.com/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c","format":{"name":"url"}},{"value":"https://medium.com/p/5b93a387639c","format":{"name":"guid"}}],"links":[{"value":"https://medium.com/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c","protocol":"https","origin":"https://medium.com","host":"medium.com","pathname":"/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c","originalProtocolKey":"url"},{"value":"https://medium.com/p/5b93a387639c","protocol":"https","origin":"https://medium.com","host":"medium.com","pathname":"/p/5b93a387639c","originalProtocolKey":"guid"}],"siblings":[{"type":"SiblingWeb2V2","protocol":{"name":"web2"},"ids":[{"value":"https://medium.com/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c","format":{"name":"url"}},{"value":"https://medium.com/p/5b93a387639c","format":{"name":"guid"}}],"originalObject":{"id":936756,"guid":"https://medium.com/p/5b93a387639c","source":"osmosis-medium","category":"defi","tickers":"OSMO","title":"Smart Accounts on Osmosis: Redefining UX and Account Management in DeFi","url":"https://medium.com/osmosis/smart-accounts-on-osmosis-redefining-ux-and-account-management-in-defi-5b93a387639c","description":"[https://cdn-images-1.medium.com/max/1024/1*GVLRlJ-vnJppv710dva-xA.png]\n\nTHE CRYPTO ECOSYSTEM ADVANCES QUICKLY WHILE THE USER EXPERIENCE (UX) OFTEN LAGS BEHIND. OSMOSIS AIMS TO BRIDGE THIS GAP WITH SMART ACCOUNTS, AN INNOVATIVE ACCOUNT AND ASSET MANAGEMENT FEATURE THAT ENHANCES USABILITY, FLEXIBILITY, AND SECURITY, WITH ROBUST MULTI-DEVICE SUPPORT FOR ON-THE-GO TRADING.\n\n\nTHE VISION FOR SMART ACCOUNTS ON OSMOSIS\n\nThe vision for Osmosis Smart Accounts is to revolutionize crypto account UX by addressing common user challenges with a solution that: streamlines user onboarding and account recovery, simplifies account management, and provides a seamless and intuitive trading experience for newcomers and experienced users alike.\n\n\nSMART ACCOUNTS: KEY FEATURES AND FUNCTIONALITIES\n\nOsmosis Smart Accounts boast several key features and functionalities:\n🧪 Automation + 1-click Trading\n🧪 Multi-Key + Multi-Device Support\n🧪 Easier Onboarding + Account Recovery\n🧪 Advanced Security Protocols\n🧪 Extensible + Composable\n\n�...","pubdate":"2024-05-13T14:11:34.000Z","tags":null,"upvote":null,"downvote":null,"bullish":null,"bearish":null,"important":null,"scam":null,"comments_count":null,"latest_action_added_time":null}}],"db":{"key":936756},"source":{"name":"osmosis-medium"},"categories":[{"name":"defi"}]}
