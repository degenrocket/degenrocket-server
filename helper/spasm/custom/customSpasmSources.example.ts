// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const spasmSourcesFrequencyHigh =
  [
    // ====================================
    // sources are sorted by name
    // {
    //   name: "",
    //   url: "",
    //   query: "",
    // },
    {
      name: "degenrocket.space",
      url: "https://degenrocket.space/api/posts",
      query: "?webType=web3&category=any&platform=false&source=false&activity=hot&keyword=false&ticker=false&limitWeb2=0&limitWeb3=20",
    },
  ];

export const spasmSourcesFrequencyMedium =
  [
    // ====================================
    // sources are sorted by name
    // {
    //   name: "degenrocket.space",
    //   url: "https://degenrocket.space/api/posts",
    //   query: "?webType=web3&category=any&platform=false&source=false&activity=hot&keyword=false&ticker=false&limitWeb2=0&limitWeb3=20",
    // },
  ];

export const spasmSourcesFrequencyLow =
  [
    // ====================================
    // sources are sorted by name
    // {
    //   name: "",
    //   url: "",
    //   query: "",
    // },
  ];

// Test sources are used for testing the RSS module
export const spasmSourcesFrequencyTest =
  [
    // ====================================
    // sources are sorted by name
    // {
    //   name: "",
    //   url: "",
    //   query: "",
    // },
  ];

// Archived sources are not used for fetching updates
export const spasmSourcesArchived =
  [
    // ====================================
    // sources are sorted by name
    // {
    //   name: "",
    //   url: "",
    //   query: "",
    // },
  ];
