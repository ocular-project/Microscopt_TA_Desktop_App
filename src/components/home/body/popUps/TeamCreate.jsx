import {useEffect, useRef, useState} from "react";
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../utils/Button.jsx";
import Input from "../../../utils/Input.jsx";
import css from "../../../css/general.module.css";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import AutoDiv from "../autoComplete/AutoDiv.jsx";
import Users from "../autoComplete/Users.jsx";
import Warning1 from "../helpers/Warning1.jsx";
import Warning2 from "../helpers/Warning2.jsx";
import { X, Info, Download, Upload, CheckCircle2, UserPlus, FileSpreadsheet } from 'lucide-react';
import * as XLSX from "xlsx";

export default function TeamCreate({ setIsPop, setLoader, setTeams, setMessage, setScreen }){

    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [team, setTeam] = useState({name: "", users: []})
    const [selectedUsers, setSelectedUsers] = useState([])
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'upload'
    const [manualInput, setManualInput] = useState('');
    const [uploadedMembers, setUploadedMembers] = useState([]);
    const [fileName, setFileName] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [xlsxLoaded, setXlsxLoaded] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setError(null)
        if(activeTab === "manual") {
           setFileName(null)
           setUploadedMembers([])
            setSelectedFile(null)
        }else {
            setSelectedUsers([])
            setTeam({...team, users: []})
        }
    }, [activeTab]);

    // useEffect(() => {
    //     const script = document.createElement('script');
    //     script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
    //     script.async = true;
    //     script.onload = () => setXlsxLoaded(true);
    //     document.head.appendChild(script);
    //     return () => {
    //       if (document.head.contains(script)) {
    //         document.head.removeChild(script);
    //       }
    //     };
    // }, []);

    const handleCancel = () => {
        setTeam({name: "", users: []})
        setIsPop(false)
        setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
    }

    const handleCreate = async () => {
        setError(null)
        if (activeTab === 'manual') {
            if (team.name.length === 0 || team.users.length === 0) {
                setError("Please fill in all the fields")
            }
            else {

                setLoader(true)
                try
                {
                    const response = await axiosInstance.post('teams', team)
                    console.log(response.data)
                    setTeam({name: "", users: []})
                    setIsPop(false)
                    setTeams(prev => [response.data, ...prev])
                    handleMessage("Team created successfully", "success", setMessage)
                    setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
                }
                catch (err) {
                    console.log(err.response)
                    const error = err.response
                    if (error.status === 400){
                        setError(err.response.data.detail[0].msg);
                    }
                    else {
                        setError(err.response?.data?.detail || 'An error occurred');
                    }

                }
                finally {
                    setLoader(false)
                }
            }
        }
        else {
            if (team.name.length === 0) {
                setError("Please enter a team name.")
                return
            }
             if (!selectedFile) {
                setError("Please select an excel file to upload.")
                return
            }
            setLoader(true)
             try {
                 const formData = new FormData()
                 formData.append('name', team.name)
                 formData.append('file', selectedFile)

                 const response = await axiosInstance.post('teams-upload', formData)
                 setTeam({name: "", users: []})
                 setIsPop(false)
                 setTeams(prev => [response.data, ...prev])
                 handleMessage("Team created successfully", "success", setMessage)
                 setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
                 setSelectedFile(null)
             }
             catch (err) {
                console.log(err.response)
                setError(err.response?.data?.detail || 'An error occurred');
            }
             finally {
                setLoader(false)
            }
        }

    }

    useEffect(() => {
        const fetchData = async () => {
            setLoader(true)
            setError(null)
            try {
                const response2 = await axiosInstance.get('users')
                const data = response2.data
                setUsers(data)
                // console.log(data)

            } catch (err) {
                console.log(err.response);
                setError(err.response?.data?.error || 'An error occurred');
            } finally {
                setLoader(false);
            }
        }

        fetchData()
    }, []);

    useEffect(() => {
        const emails = selectedUsers.map(user => user.email)
        setTeam({...team, users: emails})
    }, [selectedUsers]);

    const downloadSample = () => {
        // if (!window.XLSX) return;
        const data = [
          { "First Name": "John", "Last Name": "Doe", "Email": "john@example.com" },
          { "First Name": "Jane", "Last Name": "Smith", "Email": "jane@example.com" }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Team Members");
        ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }];
        XLSX.writeFile(wb, "team_members_template.xlsx");
    }

    const handleFileUpload = (e) => {

        setLoader(true)

        const file = e.target.files[0];
        if (!file || !window.XLSX) {
             setLoader(false)
            return
        }

        setSelectedFile(file)
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target.result;
          const workbook = window.XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = window.XLSX.utils.sheet_to_json(worksheet);
          const validData = json.filter(row => row.Email || row.email || row.EMAIL);
          setUploadedMembers(validData);
          // console.log(validData)
        };
        reader.readAsBinaryString(file);
        setLoader(false)
    }

return (
        <div className={styles.main}>

            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Creating a team</h1>
                    <p>Bring people together by creating a team to collaborate.</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

             <hr/>

             <Input title="Team name" category="input"
                    value={team.name}
                    onChange={(obj) => setTeam({...team, name: obj})} />

              <p className="mt-5 font-[400] text-[12px]">Team members</p>

              <div className="flex bg-gray-100 p-1 rounded-lg mt-2 mb-5">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'manual' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UserPlus size={12} />
                  Manual
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileSpreadsheet size={12} />
                  Bulk Upload
                </button>
              </div>

             {activeTab === 'manual' ? (
                 <Users users={users} en="Enter email or name" heading="" setSelectedUsers={setSelectedUsers} selectedUsers={selectedUsers} />
              // <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              //   <textarea
              //     value={manualInput}
              //     onChange={(e) => setManualInput(e.target.value)}
              //     placeholder="Enter email addresses separated by commas or new lines..."
              //     className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all text-sm min-h-[120px] resize-none"
              //   />
              // </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center space-y-4">
                {fileName ? (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200 flex items-center gap-3 w-full max-w-xs">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate">{fileName}</p>
                      <p className="text-[10px] text-green-600 font-bold">{uploadedMembers.length} members found</p>
                    </div>
                    <button
                      onClick={() => { setFileName(null); setUploadedMembers([]); }}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100 text-gray-400">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Upload your member list</p>
                      <p className="text-xs text-gray-500 mt-1">Excel or CSV files only</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={!xlsxLoaded}
                        className="bg-[#e89445] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#d6853a] transition-all"
                      >
                        Choose File
                      </button>
                      <button
                        onClick={downloadSample}
                        className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5"
                      >
                        <Download size={12} />
                        Sample Template
                      </button>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                />
              </div>
            )}

          {/* Guidance Box */}
            {
                activeTab === 'manual' ? (
                    <Warning1/>
                ) : (
                    <Warning2 />
                )
            }

             {
                error && <div className={css.error}>{error}</div>
             }


             <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Create Team" status="active" onClick={handleCreate} />
            </div>
        </div>
    )
}