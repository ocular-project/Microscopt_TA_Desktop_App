import styles from "../css/general.module.css"
import Sidebar from "./Sidebar.jsx";
import Header from "./body/Header.jsx";
import Container from "./body/Container.jsx";
// import ImageView from "./body/annotation/ImageView.jsx";
import {useEffect, useState} from "react";
import Success from "./body/Success.jsx";
import FolderOrShared from "./FolderOrShared.jsx";

export default function Folder(){

    return (
        <FolderOrShared cat="folder"/>
    )
}