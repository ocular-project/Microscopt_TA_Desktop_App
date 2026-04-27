import {useEffect, useState} from 'react'
import './App.css'
import {BrowserRouter, HashRouter, Route, Routes} from "react-router-dom";
import Folder from "./components/home/Folder.jsx";
import Login from "./components/account/Login.jsx";
import SignUp from "./components/account/SignUp.jsx";
import Team from "./components/home/Team.jsx";
import ProtectedRoute from "./components/home/ProtectedRoute.jsx";
import Shared from "./components/home/Shared.jsx";
import UpdateNames from "./components/account/UpdateNames.jsx";
import LawyerTerms from "./components/home/body/LawyerTerms.jsx";
import ImageAnnotator from "./components/home/ImageAnnotator.jsx";
import ImageView from "./components/home/ImageView.jsx";
import Forgot from "./components/account/Forgot.jsx";
import Reset from "./components/account/Reset.jsx";
import {configg} from "./components/utils/files/config.js";
import MyComputer from "./components/home/MyComputer.jsx";
// import DOMPurify from "quill/formats/link.js";
import DOMPurify from "dompurify";
import Devices from "./components/home/Devices.jsx";
import Adb from "./Adb.jsx";

// Update Notification Component
const UpdatePopup = ({ updateData, onDismiss, isDownloading, setIsDownloading, downloadData, error }) => {
  if (!updateData) return null;

  const handleDownload = () => {
    // setIsDownloading(true);
    // // Trigger the update in Electron
    // if (window.electronAPI && window.electronAPI.downloadUpdate) {
    //     window.electronAPI.downloadUpdate();
    // } else {
    //     // Fallback for demo
    //     setTimeout(() => window.location.reload(), 1500);
    // }

    if (window.electronAPI?.openDownloadPage) {
        window.electronAPI.openDownloadPage();
    } else {
        window.open("https://microscopyteachingaid.ocular-project.com/download/69e764bdbaaa263cbcb8c5aa", "_blank");
    }
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-8 right-8 w-full max-w-sm z-[999] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden p-6 border border-black/5 shadow-2xl ring-1 ring-black/5">
        {/* Close Button */}
          {
              !isDownloading && (
                   <button
                      onClick={onDismiss}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
              )
          }

        {/* Header Content */}
        <div className="flex items-center justify-start space-x-4">
          <div className="bg-slate-50 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[12px] font-bold text-slate-900">
              Update Available
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Version {updateData.version || '2.4.0'} is ready to install.
            </p>
          </div>
        </div>

          {
              isDownloading ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Downloading...</span>
                      <span>{Math.round(downloadData?.percent || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${downloadData?.percent || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{formatSpeed(downloadData?.bytesPerSecond)}</span>
                      <span>{downloadData?.percent === 100 ? 'Finalizing...' : 'Please wait'}</span>
                    </div>
                  </div>
              ) : (
                  <>
                      {
                          updateData.releaseNotes && (
                              <>
                                  {/* Change Log Section */}
                                <div className="mt-4 bg-slate-50 rounded-lg p-3">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">What's New</h4>
                                  <div
                                      className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 text-[10px]"
                                      dangerouslySetInnerHTML={{ __html: updateData.releaseNotes }} />
                                </div>
                              </>
                          )
                      }

                        {/* Action Buttons */}
                        <div className="mt-6 flex items-center gap-3">
                          <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg font-medium cursor-pointer active:scale-95 transition-all text-[10px] flex items-center justify-center disabled:opacity-70"
                          >
                            Download Update
                          </button>
                          <button
                            onClick={onDismiss}
                            className="flex-1 bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-[10px] cursor-pointer"
                          >
                            Later
                          </button>
                        </div>
                  </>
              )
          }

          {
              error && (
                  <p className="text-[10px] text-red-400 text-left font-medium mt-4">
                      {error}
                  </p>
              )
          }
        <p className="text-[10px] text-slate-400 text-center mt-4">
          Your work will be saved automatically.
        </p>
      </div>
    </div>
  );
};

function AppRoutes({ path, setPath }) {
    return (
        <Routes>
        {
            configg() ? (
                <>
                    <Route path="/:folderId?"
                           element={
                               <MyComputer path={path} setPath={setPath}/>
                           }
                    />
                    <Route path="/collaboration/:folderId?"
                           element={
                               <ProtectedRoute>
                                   <Folder path={path} setPath={setPath}/>
                               </ProtectedRoute>
                           }
                    />
                </>
            ) : (
                <Route path="/:folderId?"
                       element={
                           <ProtectedRoute>
                               <Folder path={path} setPath={setPath}/>
                           </ProtectedRoute>
                       }
                />
            )
        }

        <Route path="/teams"
               element={
                   <ProtectedRoute>
                       <Team path={path} setPath={setPath}/>
                   </ProtectedRoute>
               }
        />

        <Route path="/sharedFiles/:folderId?"
               element={
                   <ProtectedRoute>
                       <Shared path={path} setPath={setPath}/>
                   </ProtectedRoute>
               }
        />

        <Route path="/update_profile"
               element={
                   <ProtectedRoute>
                       <UpdateNames />
                   </ProtectedRoute>
               }
        />

        <Route path="/devices" element={<Devices path={path} setPath={setPath}/>} />
        <Route path="/image" element={<ImageAnnotator />} />
        <Route path="/annotation/:cat/:fileId" element={<ImageView />} />

        <Route path="/login" element={<Login />} />
        <Route path="/sign_up" element={<SignUp />} />
        <Route path="/terms_and_privacy" element={<LawyerTerms />} />

        <Route path="/forgot_password" element={<Forgot />} />
        <Route path="/reset_password/:userId?" element={<Reset />} />

    </Routes>
    )
}

function App() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null)
    const [downloadData, setDownloadData] = useState(null)
    const [path, setPath] = useState(null)
    const [adb, setAdb] = useState(false)

    useEffect(() => {
        // Listen for updates from Electron
        if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
            window.electronAPI.onUpdateAvailable((data) => {
                // console.log('Update received:', data);
                setUpdateInfo(data);
            });
        }
    }, []);

    useEffect(() => {
        checkADBInstalled()
    }, []);

    useEffect(() => {
        const load = async () => {
            // console.log("pathx")
            const pathx = await window.electronAPI.getPath();
            // console.log(pathx)
            setPath(pathx);
        };

        load();

    }, []);

    async function checkADBInstalled() {
        const res = await window.electronAPI.checkAdbInstalled();
        if (res.success) {
          setAdb(false)
          // console.log("ADB is installed");
        } else {
          setAdb(true)
          console.error("Error:", res.error);
        }
    }

   //
   // useEffect(() => {
   //    window.electronAPI.onUpdateStatus((data) => {
   //      if (data.status === "downloaded") {
   //        setIsDownloading(false);
   //      }
   //
   //      if (data.status === "error") {
   //        setIsDownloading(false);
   //        setError(data.message);
   //      }
   //    });
   // }, []);
   //
   // useEffect(() => {
   //    window.electronAPI.onDownloadProgress((data) => {
   //      setDownloadData(data);
   //    });
   // }, []);

  return (
    // <HashRouter>
      <div className="min-h-screen relative">
          {
              adb && (
                  <Adb />
              )
          }

        {/*Update Popup Layer*/}
        <UpdatePopup
          updateData={updateInfo}
          onDismiss={() => setUpdateInfo(null)}
          setIsDownloading={setIsDownloading}
          isDownloading={isDownloading}
          downloadData={downloadData}
          error={error}
        />
        <AppRoutes path={path} setPath={setPath}/>
      </div>
    // </HashRouter>
  )
}

export default App
