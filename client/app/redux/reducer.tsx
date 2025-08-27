import type { AnyAction } from "redux";

const CURRENT_USER = "CURRENT_USER";
const LOGOUT = "LOGOUT";
const USER_LOADING = "USER_LOADING";
const SET_UNREAD_COUNT = "SET_UNREAD_COUNT";
const UPDATE_USER = "UPDATE_USER";

const initialState = {
  currentUser: null,
  userLoading: true,
  unreadCount: 0,
};

const reducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload,
      };
    case LOGOUT:
      return {
        ...state,
        currentUser: null,
      };
    case USER_LOADING:
      return {
        ...state,
        userLoading: action.payload,
      };
    case SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };
    case UPDATE_USER:
      return { ...state, currentUser: action.payload };
    default:
      return state;
  }
};

export type RootState = ReturnType<typeof reducer>;
export default reducer;
