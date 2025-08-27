import type { Dispatch } from "redux";
import axios from "axios";

const CURRENT_USER = "CURRENT_USER";
const LOGOUT = "LOGOUT";
const USER_LOADING = "USER_LOADING";
const SET_UNREAD_COUNT = "SET_UNREAD_COUNT";
export const UPDATE_USER = "UPDATE_USER";

export const getUser =
  (userId: string): any =>
  async (dispatch: Dispatch) => {
    try {
      dispatch({ type: USER_LOADING, payload: true });
      const data = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/user/${userId}`
      );

      if (data) {
        dispatch({ type: CURRENT_USER, payload: data?.data?.user });
      }
    } catch (error) {
      console.log(error);
      dispatch({ type: CURRENT_USER, payload: null });
    } finally {
      dispatch({ type: USER_LOADING, payload: false });
    }
  };

export const logout = (): any => async (dispatch: Dispatch) => {
  try {
    localStorage.removeItem("userId");
    dispatch({ type: LOGOUT });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export const fetchUnreadCount =
  (userId: string): any =>
  async (dispatch: Dispatch) => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/notifications/unread-count/${userId}`
      );
      dispatch({ type: SET_UNREAD_COUNT, payload: res.data.count });
    } catch (error) {
      console.error("Failed to fetch unread count");
    }
  };

export const updateUser = (updatedUserData: any) => (dispatch: Dispatch) => {
  dispatch({ type: UPDATE_USER, payload: updatedUserData });
};
