import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Download,
    Wifi,
    WifiOff,
    Terminal,
    ArrowRight,
    Copy,
    ExternalLink,
    ShieldCheck,
    Cpu,
    PackageCheck,
    PackageX,
    PackageSearch,
    Check,
    ChevronRight,
    Info,
    Sparkles,
    Play,
    RotateCcw,
    FileCode2,
    Zap, Loader2
} from 'lucide-react';

const REQUIRED_PACKAGES = [
  { name: 'numpy', version: '1.26.4', minPython: '3.9', description: 'Fundamental package for scientific computing' },
  { name: 'pandas', version: '2.2.1', minPython: '3.9', description: 'Data analysis and manipulation library' },
  { name: 'torch', version: '2.2.1', minPython: '3.10', description: 'Tensors and Dynamic Neural Networks' },
  { name: 'transformers', version: '4.38.2', minPython: '3.10', description: 'State-of-the-art Natural Language Processing' },
  { name: 'onnxruntime', version: '1.17.1', minPython: '3.9', description: 'High-performance inference engine for ONNX models' },
  { name: 'opencv-python', version: '4.9.0.80', minPython: '3.9', description: 'Computer vision library' }
];

const SCENARIOS = {
  MISSING_PYTHON: 'MISSING_PYTHON',
  ALL_PACKAGES_VALID: 'ALL_PACKAGES_VALID',
  AUTO_INSTALL_SUCCESS: 'AUTO_INSTALL_SUCCESS',
  AUTO_INSTALL_PARTIAL_FAIL: 'AUTO_INSTALL_PARTIAL_FAIL',
  NO_INTERNET: 'NO_INTERNET'
};

export default function SystemCheck({ setSystemCheck }){

    const [scenario, setScenario] = useState(SCENARIOS.AUTO_INSTALL_PARTIAL_FAIL);
    const [status, setStatus] = useState('CHECKING_PYTHON'); // CHECKING_PYTHON, NO_PYTHON, CHECKING_PACKAGES, PACKAGES_OK, CHECKING_NET, NO_NET, INSTALLING, INSTALL_SUCCESS, INSTALL_FAILED
    const [pythonVersion, setPythonVersion] = useState(null);
    const [missingPackages, setMissingPackages] = useState([]);
    const [installProgress, setInstallProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [installResults, setInstallResults] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');
    const [copiedLog, setCopiedLog] = useState(false);
    const logContainerRef = useRef(null);
    const [packages, setPackages] = useState([])
    const diagnosticsStarted = useRef(false);

   const addLog = useCallback((message) => {
        setLogs((prev) => [...prev, message]);
   }, []);

   /**
   * Check whether Python exists and has the correct version.
   */
  const checkPython = useCallback(async () => {
    addLog("[SYS] Checking Python runtime...");

    const result = await window.electronAPI.check();

    if (!result.exists) {
      addLog("[ERR] Python runtime was not found.");
      setStatus("NO_PYTHON");
      return false;
    }

    if (result.error) {
      addLog(`[ERR] ${result.error}`);
      // setStatus("PYTHON_ERROR");
      return false;
    }

    setPythonVersion(result.version);
    addLog(`[OK] Python runtime found: ${result.version}`);

    return true;
  }, [addLog]);

  /**
   * Check all required Python packages.
   */
  const checkPackages = useCallback(async () => {
    setStatus("CHECKING_PACKAGES");
    addLog("[SYS] Checking Python dependencies...");

    const result = await window.electronAPI.checkPackages();

    if (!result.success) {
      addLog(`[ERR] ${result.error ?? "Unable to check Python dependencies."}`);
      // setStatus("PACKAGE_CHECK_FAILED");
      return null;
    }

    setPackages(result.packages ?? []);
    setMissingPackages(result.missing ?? []);

    const installedCount = (result.packages ?? []).filter((packageItem) => packageItem.installed).length;
    const totalCount = result.packages?.length ?? 0;

    addLog(`[SYS] Dependencies checked: ${installedCount}/${totalCount} installed.`);

    if (result.allInstalled) {
      addLog("[OK] All Python dependencies are installed.");
      setInstallProgress(100);
      setStatus("PACKAGES_OK");
      setTimeout(() => {
          handleProceed()
      }, 500)

      return result;
    }

    addLog(`[WARN] ${result.missing.length} package(s) are missing.`);

    result.missing.forEach((packageItem) => {
      addLog(`[WARN] Missing package: ${packageItem.name}`);
    });

    // setStatus("PACKAGES_MISSING");

    return result;
  }, [addLog]);

  /**
   * Install missing packages.
   */
  const executeAutoInstall = useCallback(
    async (packagesToInstall) => {
      if (!packagesToInstall?.length) {
        return;
      }

      setStatus("INSTALLING")

      setInstallProgress(0);
      setInstallResults([]);

      addLog("------------------------------------------------");
      addLog(`[SYS] Starting installation of ${packagesToInstall.length} package(s)...`);

      const packageNames = packagesToInstall.map((packageItem) => packageItem.name);
      addLog(`[SYS] Packages: ${packageNames.join(", ")}`);

      try {
        const result = await window.electronAPI.installPackages(packageNames);

        if (result.success) {
          addLog("------------------------------------------------");
          addLog("[OK] All missing dependencies installed successfully!");
          addLog("[SYS] Verifying Python environment...");

          /*
           * Do not rely only on the installation result.
           * Check the Python environment again.
           */
          const verification = await window.electronAPI.checkPackages();

          if (verification.success && verification.allInstalled) {
            setPackages(verification.packages ?? []);
            setMissingPackages([]);
            setInstallProgress(100);
            setStatus("INSTALL_SUCCESS");

            addLog("[OK] All dependencies verified successfully.");
            addLog("[SYS] Python environment is fully configured.");
            return;
          }

          /*
           * Installation returned success but verification
           * found packages that are still missing.
           */
          const remaining = verification.missing ?? [];

          setMissingPackages(remaining);
          setPackages(verification.packages ?? []);
          setStatus("INSTALL_FAILED");

          addLog(`[ERR] ${remaining.length} package(s) are still missing.`);

          remaining.forEach((packageItem) => {
            addLog(`[ERR] Missing after installation: ${packageItem.name}`);
          });

          return;
        }

        setStatus("INSTALL_FAILED");

        addLog("------------------------------------------------");
        addLog("[ERR] Automated installation completed with errors.");
        addLog(`[SYS] ${result.installed?.length ?? 0} succeeded, ${result.failed?.length ?? 0} failed.`);

        if (result.failed?.length) {
          result.failed.forEach((failedPackage) => {
            addLog(`[ERR] ${failedPackage.name}: ${failedPackage.reason ?? "Installation failed."}`);
          });
        }

        /*
         * Refresh package state even after partial failure.
         */
        const verification = await window.electronAPI.checkPackages();

        if (verification.success) {
          setPackages(verification.packages ?? []);
          setMissingPackages(verification.missing ?? []);
        }
      } catch (error) {
        setStatus("INSTALL_FAILED");
        addLog(`[ERR] ${error?.message ?? "An unexpected installation error occurred."}`);

        /*
         * Refresh package state after an unexpected error.
         */
        try {
          const verification = await window.electronAPI.checkPackages();

          if (verification.success) {
            setPackages(verification.packages ?? []);
            setMissingPackages(verification.missing ?? []);
          }
        } catch {
          addLog("[ERR] Unable to verify package state after installation failure.");
        }
      }
    },
    [addLog]
  );

  /**
   * Main diagnostic flow.
   *
   * Python -> packages -> installation if required.
   */
  const runDiagnostics = useCallback(async () => {
    setStatus("CHECKING_PYTHON");
    setLogs([]);
    setInstallResults([]);
    setInstallProgress(0);

    addLog("================================================");
    addLog("[SYS] Starting Python environment diagnostics...");
    addLog("================================================");

    try {
      /*
       * STEP 1: Check Python runtime.
       */
      const pythonReady = await checkPython();
      if (!pythonReady) return;

      /*
       * STEP 2: Check Python packages.
       */
      const packageResult = await checkPackages();

      console.log(packageResult)

      if (!packageResult || packageResult.allInstalled) return;

      /*
       * STEP 3: Missing packages exist. Check internet connection.
       */
      addLog("[SYS] Checking internet connection...");

      const internetResult = await window.electronAPI.checkInternet?.();

      /*
       * If checkInternet is not implemented yet, allow installation to proceed.
       */
      if (internetResult && internetResult.success === false) {
        setStatus("NO_NET");
        addLog("[ERR] Internet connection is required to install missing packages.");
        return;
      }

      addLog("[OK] Internet connection available.");

      console.log("installing")

      /*
       * STEP 4: Install missing packages returned by checkPackages().
       */
      await executeAutoInstall(packageResult.missing);

    } catch (error) {
      console.error("Python diagnostics error:", error);
      // setStatus("ERROR");
      addLog(`[ERR] ${error?.message ?? "An unexpected error occurred during diagnostics."}`);
    }
  }, [addLog, checkPackages, checkPython, executeAutoInstall]);

  useEffect(() => {
      const removeListener =
        window.electronAPI.onInstallProgress((data) => {
          if (data.type === "package-start") {
            setLogs(prev => [
              ...prev,
              data.message
            ]);

            setInstallProgress(data.progress);
          }

          if (data.type === "log") {
            const lines = data.message
              .split("\n")
              .filter(Boolean);

            setLogs(prev => [
              ...prev,
              ...lines
            ]);
          }

          if (data.type === "package-success") {
            setLogs(prev => [
              ...prev,
              data.message
            ]);

            setInstallProgress(data.progress);

            setInstallResults(prev => [
              ...prev,
              {
                name: data.name,
                status: "success",
                reason: "Successfully installed and validated binaries"
              }
            ]);
          }

          if (data.type === "package-failed") {
            setLogs(prev => [
              ...prev,
              data.message
            ]);

            setInstallProgress(data.progress);

            setInstallResults(prev => [
              ...prev,
              {
                name: data.name,
                status: "failed",
                reason: data.message
              }
            ]);
          }
        });

      return removeListener;
    }, []);

  useEffect(() => {
    if (diagnosticsStarted.current) return;

    diagnosticsStarted.current = true;
    runDiagnostics();
  }, [runDiagnostics]);

    // Auto scroll terminal logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);


  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleProceed = () => {
      setSystemCheck(false)
  }

    return (
        <div className="text-slate-800 font-sans flex flex-col justify-between selection:bg-[#FEF3E7] selection:text-[#F69220]">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F69220] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-2">
                        Environment Inspector
                        <span className="text-xs bg-[#FEF3E7] text-[#F69220] font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                          v2.4 Core
                        </span>
                      </h1>
                      <p className="text-xs text-slate-500">System Python & Dependency Verification Engine</p>
                    </div>
                  </div>

                  {/* Interactive Test Scenario Picker */}
                  {/*<div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">*/}
                  {/*  <span className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-1">*/}
                  {/*    <Sparkles className="w-3.5 h-3.5 text-[#F69220]" /> Test Case:*/}
                  {/*  </span>*/}
                  {/*  <select*/}
                  {/*    value={scenario}*/}
                  {/*    onChange={(e) => runDiagnostics(e.target.value)}*/}
                  {/*    className="text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F69220] shadow-sm cursor-pointer"*/}
                  {/*  >*/}
                  {/*    <option value={SCENARIOS.AUTO_INSTALL_PARTIAL_FAIL}>1. Package Install Errors (Failed Demo)</option>*/}
                  {/*    <option value={SCENARIOS.MISSING_PYTHON}>2. Python Missing (App Update Needed)</option>*/}
                  {/*    <option value={SCENARIOS.ALL_PACKAGES_VALID}>3. All Packages Ready (Direct Launch)</option>*/}
                  {/*    <option value={SCENARIOS.AUTO_INSTALL_SUCCESS}>4. Missing Packages + Internet (Auto-Install OK)</option>*/}
                  {/*    <option value={SCENARIOS.NO_INTERNET}>5. Missing Packages + Offline (No Internet)</option>*/}
                  {/*  </select>*/}
                  {/*  <button*/}
                  {/*    onClick={() => runDiagnostics(scenario)}*/}
                  {/*    className="p-1.5 bg-white border border-slate-300 hover:border-[#F69220] text-slate-600 hover:text-[#F69220] rounded-lg transition-colors shadow-sm"*/}
                  {/*    title="Rerun Diagnostic Verification"*/}
                  {/*  >*/}
                  {/*    <RotateCcw className="w-4 h-4" />*/}
                  {/*  </button>*/}
                  {/*</div>*/}
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 my-4 flex flex-col justify-center">
                <div className="mb-8">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span className={status === 'CHECKING_PYTHON' || status === 'NO_PYTHON' ? 'text-[#F69220]' : 'text-slate-700'}>
                          1. Python Runtime
                        </span>
                        <span className={status === 'CHECKING_PACKAGES' || status === 'PACKAGES_OK' ? 'text-[#F69220]' : 'text-slate-700'}>
                          2. Package Audit
                        </span>
                        <span className={status.includes('INSTALL') || status === 'NO_NET' ? 'text-[#F69220]' : 'text-slate-700'}>
                          3. Automatic Setup
                        </span>
                        <span>4. Application Launch</span>
                      </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#F69220] transition-all duration-500 ease-out"
                          style={{
                            width: status === 'CHECKING_PYTHON' ? '20%'
                              : status === 'NO_PYTHON' ? '25%'
                              : status === 'CHECKING_PACKAGES' ? '45%'
                              : status === 'PACKAGES_OK' ? '100%'
                              : status === 'NO_NET' ? '65%'
                              : status === 'INSTALLING' ? `${65 + (installProgress * 0.3)}%`
                              : status === 'INSTALL_SUCCESS' ? '100%'
                              : '85%'
                          }}
                        />
                    </div>
                </div>

                <div className="">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-y-auto max-h-[70vh] transition-all duration-300">
                    {status === 'CHECKING_PYTHON' && (
                        <div className="p-12 text-center flex flex-col items-center">
                          <div className="relative mb-6">
                            <Loader2 className="w-20 h-20 text-primary animate-spin" strokeWidth={1} />
                            <div className="absolute inset-0 flex items-center justify-center text-[#F69220]">
                              <Cpu className="w-8 h-8" />
                            </div>
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mb-2">Inspecting System Environment</h2>
                          <p className="text-slate-500 text-xs max-w-md">
                            Verifying local system dependencies, checking Python executable paths, and validating runtime security parameters...
                          </p>
                        </div>
                    )}

                    {status === 'NO_PYTHON' && (
                        <div className="p-8 sm:p-10">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 text-[#F69220]">
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-[#F69220] mb-3">
                                Action Required: Missing Runtime
                              </div>
                              <h2 className="text-lg font-bold text-slate-900 mb-3">
                                Compatible Python Environment Not Found
                              </h2>
                              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                This application requires a specialized Python environment to run high-performance AI models.
                                Rather than configuring manual environment variables or installing separate interpreters,
                                <strong className="text-slate-900 font-semibold"> please download and install the latest bundled version of our application</strong>,
                                which now comes pre-packaged with a complete, fully-configured Python environment.
                              </p>

                              <div className="bg-[#FEF3E7] border border-orange-200/70 rounded-xl p-4 mb-6">
                                <h3 className="text-xs font-bold text-[#F69220] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Info className="w-4 h-4" /> Why upgrade to the self-contained app installer?
                                </h3>
                                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                                  <li>Includes isolated Python 3.11+ runtime pre-tuned for optimized performance.</li>
                                  <li>Zero conflicts with existing global Python installations or venv paths.</li>
                                  <li>Includes pre-compiled C++ native binaries for machine learning modules.</li>
                                </ul>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => alert("Simulating download of the new application installer bundle with embedded Python...")}
                                  className="text-sm px-4 py-3 bg-[#F69220] hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 group"
                                >
                                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                                  Download Bundled App Upgrade (.exe / .dmg)
                                </button>
                                <button
                                  onClick={() => runDiagnostics()}
                                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Re-check System
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                    )}

                    {status === 'CHECKING_PACKAGES' && (
                        <div className="p-10 text-center flex flex-col items-center">
                          <div className="relative mb-6">
                            <Loader2 className="w-20 h-20 text-primary animate-spin" strokeWidth={1} />
                            <div className="absolute inset-0 flex items-center justify-center text-[#F69220]">
                              <PackageSearch className="w-8 h-8" />
                            </div>
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mb-2">Auditing Python Packages</h2>
                          <p className="text-slate-500 text-sm max-w-md mb-6">
                            Analyzing installed modules in site-packages and verifying version compatibility against application requirements...
                          </p>

                          <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Auditing Required Libraries</span>
                              <span className="text-[#F69220] font-bold animate-pulse">Scanning...</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              {REQUIRED_PACKAGES.map(pkg => (
                                <div key={pkg.name} className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded border border-slate-200 shadow-sm">
                                  <RefreshCw className="w-3.5 h-3.5 text-[#F69220] animate-spin shrink-0" />
                                  <span className="truncate">{pkg.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    {status === 'PACKAGES_OK' && (
                        <div className="p-10 text-center flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mb-2">Environment Verification Passed!</h2>
                          <p className="text-slate-600 text-xs max-w-md mb-6">
                            Python <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{pythonVersion?.split(' ')[1]}</span> and all required libraries are installed and ready.
                          </p>

                          <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Verified Packages</span>
                              <span className="text-emerald-600 font-bold">{packages.length}/{packages.length} Ready</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              {packages?.map(pkg => (
                                <div key={pkg.name} className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded border border-slate-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{pkg.name} v{pkg.version}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/*<button*/}
                          {/*  onClick={handleProceed}*/}
                          {/*  className="text-sm px-4 py-3 bg-[#F69220] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 group"*/}
                          {/*>*/}
                          {/*  Proceed to Image Analysis*/}
                          {/*  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />*/}
                          {/*</button>*/}
                        </div>
                    )}

                    {status === 'NO_INTERNET' && (
                        <div className="p-8">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                              <WifiOff className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
                                Network Connection Required
                              </span>
                              <h2 className="text-lg font-bold text-slate-900 mb-2">
                                Internet Offline — Automated Package Download Paused
                              </h2>
                              <p className="text-slate-600 text-xs mb-4">
                                Python is available, but <span className="font-semibold text-slate-800">{missingPackages.length} required libraries</span> are missing. An active internet connection is needed to automatically fetch them from PyPI.
                              </p>

                              {/* Missing List */}
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                  Packages Pending Installation:
                                </h3>
                                <div className="space-y-2">
                                  {missingPackages.map(pkg => (
                                    <div key={pkg.name} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                                      <span className="font-mono font-bold text-slate-800">{pkg.name}</span>
                                      <span className="font-mono font-bold text-slate-800">{pkg.name} ({pkg.version})</span>
                                      {/*<span className="text-slate-500 text-xs">{pkg.description}</span>*/}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => runDiagnostics()}
                                  className="px-5 py-2.5 bg-[#F69220] hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-orange-500/15 text-sm flex items-center gap-2"
                                >
                                  <Wifi className="w-4 h-4" />
                                  Retry Connection
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                    )}

                    {status === 'INSTALLING' && (
                        <div className="p-8">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#F69220]">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                              </div>
                              <div>
                                <h2 className="font-bold text-slate-900 text-md">Installing Required Python Packages...</h2>
                                <p className="text-xs text-slate-500">Retrieving wheels from PyPI index</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-[#F69220]">{installProgress}%</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-200">
                            <div
                              className="bg-[#F69220] h-full transition-all duration-300"
                              style={{ width: `${installProgress}%` }}
                            />
                          </div>

                          {/* Console Output */}
                          <div className="bg-slate-900 text-slate-200 font-mono text-xs rounded-xl p-4 h-70 overflow-y-auto border border-slate-800 shadow-inner" ref={logContainerRef}>
                            {logs.map((log, index) => (
                              <div key={index} className="py-0.5 leading-relaxed">
                                <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                <span className={
                                  log.includes('[OK]') ? 'text-emerald-400 font-semibold' :
                                  log.includes('[ERR]') || log.includes('[FAIL]') ? 'text-rose-400 font-semibold' :
                                  log.includes('[WARN]') ? 'text-amber-300' : 'text-slate-300'
                                }>
                                  {log}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}

                    {status === 'INSTALL_SUCCESS' && (
                        <div className="p-10 text-center flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mb-2">Automated Setup Complete!</h2>
                          <p className="text-slate-600 text-xs max-w-md mb-6">
                            All missing Python packages were fetched and verified successfully. Your system is now fully compatible.
                          </p>
                          <button
                            onClick={handleProceed}
                            className="text-sm px-4 py-3 bg-[#F69220] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                          >
                            Proceed to Image Analysis <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                    )}

                    {status === 'INSTALL_FAILED' && (
                        <div className="p-6 sm:p-8">
                          {/* Header */}
                          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                <PackageX className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  Installation Partial Failure
                                </span>
                                <h2 className="text-md font-bold text-slate-900 mt-1">
                                  Some Required Packages Failed to Install
                                </h2>
                                <p className="text-xs text-slate-500">
                                  Review failure reasons below and recommended resolution steps.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={handleCopyLogs}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
                            >
                              {copiedLog ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              {copiedLog ? 'Logs Copied!' : 'Copy Debug Log'}
                            </button>
                          </div>

                          {/* Navigation Tabs */}
                          <div className="flex items-center gap-4 my-4 border-b border-slate-200">
                            <button
                              onClick={() => setActiveTab('summary')}
                              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                                activeTab === 'summary' 
                                  ? 'border-[#F69220] text-[#F69220]' 
                                  : 'border-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <PackageX className="w-4 h-4" />
                              Failed Packages ({installResults.filter(r => r.status === 'failed').length})
                            </button>
                            <button
                              onClick={() => setActiveTab('all')}
                              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                                activeTab === 'all' 
                                  ? 'border-[#F69220] text-[#F69220]' 
                                  : 'border-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <PackageCheck className="w-4 h-4" />
                              All Attempted ({installResults.length})
                            </button>
                            <button
                              onClick={() => setActiveTab('logs')}
                              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                                activeTab === 'logs' 
                                  ? 'border-[#F69220] text-[#F69220]' 
                                  : 'border-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Terminal className="w-4 h-4" />
                              Console Output
                            </button>
                          </div>

                          {/* Tab 1: Failed Packages Breakdown */}
                          {activeTab === 'summary' && (
                            <div className="space-y-3 my-4">
                              {installResults.filter(r => r.status === 'failed').map((pkg) => (
                                <div key={pkg.name} className="bg-rose-50/60 border border-rose-200 rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span className="font-mono font-bold text-slate-900 text-sm">{pkg.name}</span>
                                      <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                        v{pkg.version}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                      Failed
                                    </span>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-rose-200/80 text-xs font-mono text-rose-900 leading-relaxed">
                                    <strong className="text-slate-700 font-sans block mb-0.5 font-bold">Failure Reason:</strong>
                                    {pkg.reason}
                                  </div>
                                </div>
                              ))}

                              {/* Recommendation Callout */}
                              <div className="bg-[#FEF3E7] border border-orange-200/80 rounded-xl p-4 mt-4">
                                <h3 className="text-xs font-bold text-[#F69220] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Zap className="w-4 h-4" /> Suggested Solutions
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  1. Download the bundled installer which includes pre-compiled wheel binaries without requiring C++ build tools.<br />
                                  2. Or run <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono text-orange-900">pip install --no-cache-dir torch</code> manually in administrator terminal.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Tab 2: All Packages Grid */}
                          {activeTab === 'all' && (
                            <div className="space-y-2 my-4">
                              {installResults.map((pkg) => (
                                <div
                                  key={pkg.name}
                                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                    pkg.status === 'success' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {pkg.status === 'success' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                    <div>
                                      <span className="font-mono font-bold text-slate-900">{pkg.name}</span>
                                      <span className="text-slate-500 ml-2 font-mono">v{pkg.version}</span>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                    pkg.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {pkg.status === 'success' ? 'Installed' : 'Failed'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tab 3: Terminal Output */}
                          {activeTab === 'logs' && (
                            <div className="bg-slate-900 text-slate-200 font-mono text-xs rounded-xl p-4 h-60 overflow-y-auto border border-slate-800 my-4">
                              {logs.map((log, index) => (
                                <div key={index} className="py-0.5">
                                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                  <span className={
                                    log.includes('[OK]') ? 'text-emerald-400 font-semibold' :
                                    log.includes('[ERR]') || log.includes('[FAIL]') ? 'text-rose-400 font-semibold' :
                                    log.includes('[WARN]') ? 'text-amber-300' : 'text-slate-300'
                                  }>
                                    {log}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => runDiagnostics()}
                                className="px-4 py-2.5 bg-[#F69220] hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-orange-500/15 flex items-center gap-2"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry Installation
                              </button>
                              <button
                                onClick={() => setScenario(SCENARIOS.MISSING_PYTHON)}
                                className="px-4 py-2.5 bg-[#FEF3E7] hover:bg-orange-100 text-[#F69220] font-semibold rounded-xl text-xs border border-orange-200/80 transition-colors flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Get App Bundled Version
                              </button>
                            </div>

                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              Diagnostic Code: ENV_PKG_409
                            </span>
                          </div>
                        </div>
                    )}

                </div>

                    <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
                      {/*<span className="flex items-center gap-1">*/}
                      {/*  <Cpu className="w-3.5 h-3.5 text-slate-400" /> System Architecture: x86_64*/}
                      {/*</span>*/}
                      {/*<span>•</span>*/}
                      <span className="flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5 text-slate-400" /> Target Env: CPython 3.12.14
                      </span>
                    </div>
                </div>

            </main>
        </div>
    )
}