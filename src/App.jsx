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
import ModelAnalyzer from "./components/home/model/ModelAnalyzer.jsx";
import { TriangleAlert, Globe, Download, Loader2 } from "lucide-react";

// --------------------------------------------------
// ADB SETUP POPUP
// --------------------------------------------------


const AdbSetupPopup = ({
    status,
    onRetry,
    onDismiss
}) => {
    if (
        !status ||
        !['checking-internet', 'installing', 'error'].includes(status.status)
    ) {
        return null;
    }

    const isChecking = status.status === 'checking-internet';
    const isInstalling = status.status === 'installing';
    const isError = status.status === 'error';

    const percent = Math.min(100, Math.max(0, status.percent || 0));

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                {/* Close button: only available on error */}
                {/*{isError && (*/}
                {/*    <button*/}
                {/*        onClick={onDismiss}*/}
                {/*        className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"*/}
                {/*        aria-label="Close"*/}
                {/*    >*/}
                {/*        ✕*/}
                {/*    </button>*/}
                {/*)}*/}

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${
                        isError
                          ? 'bg-red-50 text-red-600'
                          : 'bg-secondary text-primary'
                    }`}>
                        {isError ? (
                            <TriangleAlert />

                        ) : isChecking ? (
                            <Globe />
                            // <span className="text-2xl">🌐</span>
                        ) : (
                            <Download />
                            // <span className="text-2xl">⬇</span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            {isChecking
                                ? 'Checking Internet Connection'
                                : isInstalling
                                    ? 'Setting up Android Debug Bridge'
                                    : 'ADB Installation Failed'}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {isChecking
                                ? 'Checking whether the download servers are reachable.'
                                : isInstalling
                                    ? 'Preparing your Android device connection environment.'
                                    : 'We could not complete the ADB installation.'}
                        </p>
                    </div>
                </div>

                {/* Internet checking */}
                {isChecking && (
                    <div className="mt-7 rounded-lg bg-secondary p-4">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-7 w-7 animate-spin text-primary"/>
                            {/*<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />*/}

                            <p className="text-xs text-primary">
                                {status.message || 'Checking internet connectivity...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Installation progress */}
                {isInstalling && (
                    <div className="mt-7 space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">
                                    {status.step || 'Installing'}
                                </span>

                                <span className="text-xs font-semibold text-primary">
                                    {percent}%
                                </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs leading-relaxed text-slate-600">
                                {status.message || 'Please wait while installation completes.'}
                            </p>
                        </div>

                        <p className="text-center text-[10px] text-slate-400">
                            Please do not close the application during installation.
                        </p>
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="mt-6 space-y-4">
                        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                            <p className="text-xs font-semibold text-red-700">
                                Error details
                            </p>

                            <p className="mt-2 break-words text-xs leading-relaxed text-red-600">
                                {status.error || status.message || 'An unexpected error occurred.'}
                            </p>
                        </div>

                        <div className="flex gap-3 items-center justify-between">
                            <button
                                onClick={onDismiss}
                                className="rounded-lg w-full bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                                Dismiss
                            </button>

                            <button
                                onClick={onRetry}
                                className="rounded-lg w-full bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                                Retry
                            </button>

                        </div>

                        <p className="text-center text-[10px] text-slate-400">
                            Check your internet connection and try again.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};


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
        window.open("https://microscopyteachingaid.ocular-project.com/", "_blank");
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

       {/*<Route path="/" element={<ModelAnalyzer/>}/>*/}

    </Routes>
    )
}

function App() {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null)
    const [downloadData, setDownloadData] = useState(null)
    const [path, setPath] = useState(null)
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [internetChecked, setInternetChecked] = useState(false);
    // const [adb, setAdb] = useState(false)

    const [adbStatus, setAdbStatus] = useState({
        status: 'checking',
        message: 'Checking Android Debug Bridge...',
        percent: 0
    });

    const [adbDismissed, setAdbDismissed] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            console.log('[NETWORK] Internet connection detected.');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('[NETWORK] Internet connection lost.');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkInternetConnection = async () => {
        try {
            const response = await fetch(
                'https://dl.google.com',
                {
                    method: 'HEAD',
                    cache: 'no-store',
                    signal: AbortSignal.timeout(8000)
                }
            );

            return response.ok;
        } catch (error) {
            console.error('[NETWORK] Internet check failed:', error);
            return false;
        }
    };

    useEffect(() => {
        // Listen for updates from Electron
        if (!window.electronAPI?.onUpdateAvailable) return;

        const unsubscribe = window.electronAPI.onUpdateAvailable((data) => {
            setUpdateInfo(data);
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        const adbAPI = window.electronAPI?.adb;

        if (!adbAPI) return;

        const unsubscribe = adbAPI.onStatusChanged((data) => {
            console.log('[REACT ADB UPDATE]', data);
            setAdbStatus(data);
        });

        return () => {
            unsubscribe?.();
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const initializeAdb = async () => {
            try {
                const adbAPI = window.electronAPI?.adb;

                if (!adbAPI) return;

                console.log('[ADB] Checking installation...');

                const adbCheck = await adbAPI.check();

                if (!mounted) return;

                if (adbCheck?.success) {
                    console.log('[ADB] ADB is already installed.');

                    const currentStatus = await adbAPI.getStatus();

                    if (!mounted) return;

                    setAdbStatus({
                        ...currentStatus,
                        status: 'ready',
                        message: 'Android Debug Bridge is ready.',
                        percent: 100
                    });

                    return;
                }

                // First retrieve the current ADB state.
                // const currentStatus = await adbAPI.getStatus();

                // if (!mounted) return;
                //
                // if (currentStatus?.status === 'ready') {
                //     setAdbStatus(currentStatus);
                //     return;
                // }

                // setAdbStatus(currentStatus);

                console.log('[ADB] ADB is not installed.');
                console.log('[NETWORK] Checking internet connection...');

                setAdbStatus({
                    status: 'checking-internet',
                    step: 'Checking connectivity',
                    message: 'Checking internet connection before downloading Android Platform Tools...',
                    percent: 0
                });

                // ADB is already ready. No installation required.
                // if (currentStatus.status === 'ready') return;

                // Check internet connectivity.
                console.log('[NETWORK] Checking internet connection...');

                const connected = await window.electronAPI.checkInternet();

                if (!mounted) return;

                setInternetChecked(true);
                setIsOnline(connected);

                if (!connected) {
                    setAdbStatus({
                        status: 'error',
                        step: 'Internet connection required',
                        message: 'An internet connection is required to download Android Platform Tools.',
                        error: 'Unable to reach Google download servers. Please check your internet connection and retry.'
                    });

                    return;
                }

                // Internet is available. Start ADB installation.
                setAdbStatus({
                    status: 'installing',
                    step: 'Starting installation',
                    message: 'Preparing Android SDK Platform Tools...',
                    percent: 0
                });

                console.log('[ADB] Starting installation...');

                const result = await adbAPI.startInstall();

                if (!mounted) return;

                if (result && result.success === false) {
                    setAdbStatus({
                        status: 'error',
                        step: 'Installation failed',
                        message: 'ADB installation could not be completed.',
                        error: result.error || 'Unknown installation error.'
                    });
                }


            } catch (error) {
                console.error('[ADB] Initialization failed:', error);

                if (mounted) {
                    setAdbStatus({
                        status: 'error',
                        message: 'ADB initialization failed.',
                        error: error.message
                    });
                }
            }
        };

        initializeAdb();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const loadPath = async () => {
            try {
                if (!window.electronAPI?.getPath) return;

                const pathx = await window.electronAPI.getPath();
                setPath(pathx);
            } catch (err) {
                console.error('[APP] Could not retrieve application path:', err);
            }
        };

        loadPath();

    }, []);

    // async function checkADBInstalled() {
    //     const res = await window.electronAPI.checkAdbInstalled();
    //     if (res.success) {
    //       setAdb(false)
    //       // console.log("ADB is installed");
    //     } else {
    //       setAdb(true)
    //       console.error("Error:", res.error);
    //     }
    // }

   const retryAdbInstallation = async () => {
        setAdbDismissed(false);

        const connected = await checkInternetConnection();

        setIsOnline(connected);

        if (!connected) {
            setAdbStatus({
                status: 'error',
                step: 'Internet connection required',
                message: 'Please connect to the internet.',
                error: 'Unable to reach Google download servers. Please check your internet connection and retry.'
            });

            return;
        }

        try {
            await window.electronAPI.adb.retryInstall();
        } catch (error) {
            setAdbStatus({
                status: 'error',
                message: 'ADB installation failed.',
                error: error.message
            });
        }
    };

   const showAdbPopup =
    !adbDismissed &&
    ['checking-internet', 'installing', 'error'].includes(adbStatus.status);

  return (
    // <HashRouter>
      <div className="min-h-screen relative">

           {/* ADB Installation Popup */}
            {showAdbPopup && (
                <AdbSetupPopup
                    status={adbStatus}
                    onRetry={retryAdbInstallation}
                    onDismiss={() => window.electronAPI.closeApp()}
                />
            )}

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
