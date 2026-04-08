import styles from "../../../css/table.module.css";
import {IoMdCheckmark, IoMdClose} from "react-icons/io";
import {IoImageOutline} from "react-icons/io5";
import {FaFolder} from "react-icons/fa";
import {formatDate} from "../../../utils/files/FormatDate.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsisVertical, faXmark} from "@fortawesome/free-solid-svg-icons";

export default function DeviceTable({ devices }){
    return (
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Model</th>
                    <th>Id</th>
                    <th>Product</th>
                </tr>
            </thead>
            <tbody>
            {
                devices.map((device, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{device.model}</td>
                        <td>{device.id}</td>
                        <td>{device.product}</td>
                    </tr>
                ))
            }
            </tbody>
        </table>
    )
}