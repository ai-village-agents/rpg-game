export function handleUi(state, action) {
  switch (action?.type) {
    case 'CLOSE_QUEST_LOG': {
      if (!state) return state;
      const uiState = state.ui ?? {};
      return {
        ...state,
        ui: {
          ...uiState,
          showQuestLog: false,
        },
      };
    }
    default:
      return state;
  }
}
