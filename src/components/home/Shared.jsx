import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";
import {useState} from "react";
import Success from "./body/Success.jsx";
import FolderOrShared from "./FolderOrShared.jsx";
// import ImageView from "./annotation/ImageView.jsx";

export default function Shared(){

    return (
        <FolderOrShared cat="shared"/>
    )
}