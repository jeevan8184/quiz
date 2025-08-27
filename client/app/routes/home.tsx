import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getUser } from "~/redux/actions";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      dispatch(getUser(userId));
      navigate("/dashboard");
    }
  }, [dispatch, navigate]);
  return <Welcome />;
}
