import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Usb,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Wifi,
  BatteryCharging,
  HelpCircle,
  ArrowDown,
  Lock,
  Cpu
} from 'lucide-react';

// OEM specific configuration for menu paths, build number labels, and UI nuances
const OEM_CONFIGS = {
  pixel: {
    id: 'pixel',
    name: 'Google Pixel / Stock',
    badge: 'Android 13–15',
    settingsRootSearchHint: 'Search settings',
    devOptionsPath: ['Settings', 'System', 'Developer options'],
    buildNumberPath: ['Settings', 'About phone', 'Build number'],
    buildLabel: 'Build number',
    buildValue: 'AP2A.240905.003',
    hasSubMenuForBuild: false,
    subMenuName: '',
    extraTip: 'On Pixel devices, Developer options appears at the very bottom of Settings > System.'
  },
  samsung: {
    id: 'samsung',
    name: 'Samsung Galaxy',
    badge: 'One UI 6+',
    settingsRootSearchHint: 'Search in Settings',
    devOptionsPath: ['Settings', 'Developer options'],
    buildNumberPath: ['Settings', 'About phone', 'Software information', 'Build number'],
    buildLabel: 'Build number',
    buildValue: 'UP1A.231005.007.S928BXXU3',
    hasSubMenuForBuild: true,
    subMenuName: 'Software information',
    extraTip: 'On Samsung Galaxy, Developer options appears directly at the very bottom of the main Settings list (below About phone).'
  },
  xiaomi: {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / OPPO',
    badge: 'HyperOS / MIUI / ColorOS',
    settingsRootSearchHint: 'Search settings',
    devOptionsPath: ['Settings', 'Additional settings', 'Developer options'],
    buildNumberPath: ['Settings', 'About phone', 'OS version / Build number'],
    buildLabel: 'OS version',
    buildValue: '1.0.8.0.UNCMIXM',
    hasSubMenuForBuild: false,
    subMenuName: '',
    extraTip: 'Xiaomi/Redmi requires tapping "OS version" (or "MIUI version") 7 times. Some models also require enabling "USB debugging (Security settings)" right below the main toggle.'
  }
};

const AndroidPhoneFrame = ({ children, caption, badgeText }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[300px] rounded-[36px] bg-slate-900 p-[10px] shadow-xl border border-slate-800 select-none">
        {/* Hardware Side Buttons */}
        <div className="absolute -right-[3px] top-24 h-10 w-[3px] rounded-r bg-slate-700" />
        <div className="absolute -right-[3px] top-38 h-14 w-[3px] rounded-r bg-slate-700" />

        {/* Inner Screen */}
        <div className="relative overflow-hidden rounded-[27px] bg-[#F7F9FB] text-slate-900 flex flex-col h-[430px]">
          {/* Android Status Bar */}
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5 text-[11px] font-semibold text-slate-700 bg-white">
            <span>9:41</span>
            {/* Camera Punch Hole */}
            <div className="h-3.5 w-3.5 rounded-full bg-slate-950 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Wifi className="w-3 h-3" />
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Android Gesture Navigation Pill */}
          <div className="py-2 bg-white flex justify-center border-t border-slate-100">
            <div className="h-1 w-24 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Caption below phone */}
      {caption && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-medium text-center">
          {badgeText && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F69220]/15 text-[#d97706]">
              {badgeText}
            </span>
          )}
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
};

export default function Connected() {

    const [selectedOem, setSelectedOem] = useState('pixel');
  const oem = OEM_CONFIGS[selectedOem];

  // Checklist completion state
  const [completedSteps, setCompletedSteps] = useState({
    step1: false,
    step2: false,
    step3: false
  });

  // Interactive State for Step 1 Phone Mockup (Search simulation)
  const [searchQuery, setSearchQuery] = useState('USB debugging');
  const [simulatedAlreadyUnlocked, setSimulatedAlreadyUnlocked] = useState(false);

  // Interactive State for Step 2 Phone Mockup (7-Tap Build Number simulator)
  const [tapCount, setTapCount] = useState(0);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);

  // Interactive State for Step 3 Phone Mockup (USB Debugging toggle + RSA Dialog)
  const [usbDebuggingOn, setUsbDebuggingOn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRsaDialog, setShowRsaDialog] = useState(false);
  const [alwaysAllowPc, setAlwaysAllowPc] = useState(true);
  const [pcAuthorized, setPcAuthorized] = useState(false);

  // Copy ADB command state
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Reset interactive simulators cleanly when switching OEMs if desired, keeping UX smooth
  const handleOemChange = (oemKey) => {
    setSelectedOem(oemKey);
  };

  // Toggle step completion checkbox
  const toggleStepComplete = (stepKey) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  // Handle tapping Build Number in Step 2 simulator
  const handleBuildNumberTap = () => {
    if (developerUnlocked) return;
    const nextTap = tapCount + 1;
    setTapCount(nextTap);

    if (nextTap >= 7) {
      setShowPinPrompt(true);
    }
  };

  // Handle PIN confirmation in Step 2 simulator
  const handlePinConfirm = () => {
    setShowPinPrompt(false);
    setDeveloperUnlocked(true);
    setEnteredPin('');
    setCompletedSteps((prev) => ({ ...prev, step2: true }));
  };

  const resetStep2Simulator = () => {
    setTapCount(0);
    setShowPinPrompt(false);
    setEnteredPin('');
    setDeveloperUnlocked(false);
  };

  // Handle USB Debugging toggle in Step 3 simulator
  const handleUsbToggleClick = () => {
    if (!usbDebuggingOn) {
      setShowConfirmModal(true);
    } else {
      setUsbDebuggingOn(false);
      setShowRsaDialog(false);
      setPcAuthorized(false);
    }
  };

  const confirmEnableUsbDebugging = () => {
    setShowConfirmModal(false);
    setUsbDebuggingOn(true);
    // Automatically show the RSA fingerprint dialog after a brief moment to simulate plugging into PC
    setTimeout(() => {
      setShowRsaDialog(true);
    }, 450);
  };

  const handleRsaAllow = () => {
    setShowRsaDialog(false);
    setPcAuthorized(true);
    setCompletedSteps((prev) => ({ ...prev, step3: true }));
  };

  const resetStep3Simulator = () => {
    setUsbDebuggingOn(false);
    setShowConfirmModal(false);
    setShowRsaDialog(false);
    setPcAuthorized(false);
  };

  const handleCopyAdb = () => {
    navigator.clipboard?.writeText('adb devices');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

    return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 font-sans antialiased selection:bg-[#F69220]/20 selection:text-slate-900">
      {/* Top Sticky Progress & Brand Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F69220] flex items-center justify-center text-white shadow-sm shadow-[#F69220]/30">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                Android USB Debugging
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Interactive Setup & Verification Guide
              </span>
            </div>
          </div>

          {/* Step Progress Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <span>Progress:</span>
              <span className="font-bold text-[#F69220]">{completedCount}/3</span>
              <span>Steps</span>
            </div>
            <div className="flex gap-1">
              {['step1', 'step2', 'step3'].map((key, idx) => (
                <button
                  key={key}
                  onClick={() => scrollToSection(`phase-${idx + 1}`)}
                  title={`Jump to Step ${idx + 1}`}
                  className={`h-2.5 w-7 rounded-full transition-all duration-300 ${
                    completedSteps[key]
                      ? 'bg-[#F69220]'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Section & Device Brand Selector */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F69220]/10 text-[#d97706] text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#F69220]" />
              <span>Interactive Step-by-Step Walkthrough</span>
            </div>
            <h1 className="text-lx sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How to Check & Enable{' '}
              <span className="text-[#F69220]">USB Debugging</span> on Android
            </h1>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              USB Debugging lets your Android device communicate with your computer over Android Debug Bridge (ADB). Follow the three phases below—and try out the interactive phone screens to practice each tap.
            </p>
          </div>

          {/* OEM Device Selector Bar */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#F69220]" />
                Select Your Android Brand (Adapts Menu Paths):
              </label>
              <span className="text-xs text-slate-400">
                Currently showing: <strong className="text-slate-700">{oem.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {Object.values(OEM_CONFIGS).map((item) => {
                const isActive = selectedOem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleOemChange(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-[#F69220] bg-[#F69220]/10 shadow-xs ring-1 ring-[#F69220]'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.badge}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isActive
                          ? 'border-[#F69220] bg-[#F69220]'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            PHASE 1: CHECK IF USB DEBUGGING IS ALREADY ENABLED
        ===================================================================== */}
        <section
          id="phase-1"
          className="scroll-mt-24 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm transition-all"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F69220]/10 border border-[#F69220]/25 text-[#F69220] font-extrabold text-lg flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F69220]">
                    Phase 1 • Status Check
                  </span>
                </div>
                <h2 className="text-xl sm:text-xl font-bold text-slate-900 mt-0.5">
                  Check if USB Debugging is Already Enabled
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Before unlocking hidden menus, use Settings Search to see if Developer Options is already active.
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStepComplete('step1')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                completedSteps.step1
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#F69220] hover:text-slate-900'
              }`}
            >
              {completedSteps.step1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Checked</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span>Mark Checked</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Instructions */}
            <div className="lg:col-span-7 space-y-5">
              <ol className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Open the <strong className="text-slate-900">Settings</strong> app (gear icon) on your Android phone.
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Tap the <strong className="text-slate-900">Search bar</strong> at the top of Settings and type{' '}
                    <code className="px-2 py-0.5 rounded bg-slate-100 text-[#d97706] font-mono text-xs font-semibold">
                      USB debugging
                    </code>
                    .
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Alternatively, manually navigate to:{' '}
                    <span className="inline-flex flex-wrap items-center gap-1 font-medium text-slate-900">
                      {oem.devOptionsPath.map((crumb, i) => (
                        <React.Fragment key={crumb}>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{crumb}</span>
                          {i < oem.devOptionsPath.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                </li>
              </ol>

              {/* Interactive Decision Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F9FB] border border-slate-200/90 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <HelpCircle className="w-4 h-4 text-[#F69220]" />
                  <span>What did you see on your phone?</span>
                </div>
                <p className="text-xs text-slate-600">
                  By default, Android hides Developer Options. Choose your result below to jump straight to the right step:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      setCompletedSteps((prev) => ({ ...prev, step1: true, step2: true }));
                      scrollToSection('phase-3');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all text-left group"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-700">
                        "USB debugging" appeared!
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Developer Options is unlocked → Skip to Phase 3
                      </div>
                    </div>
                    <ArrowDown className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setCompletedSteps((prev) => ({ ...prev, step1: true }));
                      scrollToSection('phase-2');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F69220]/40 hover:border-[#F69220] hover:bg-[#F69220]/5 transition-all text-left group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#d97706]">
                        No results / Menu missing
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Unlock Developer Options → Go to Phase 2
                      </div>
                    </div>
                    <ArrowDown className="w-4 h-4 text-[#F69220] group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Interactive Phone Illustration */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidPhoneFrame
                badgeText="Interactive Preview"
                caption="Toggle between 'Locked' and 'Unlocked' search results"
              >
                {/* Settings App Header */}
                <div className="bg-white px-4 pt-2 pb-3 border-b border-slate-100">
                  <div className="text-lg font-bold text-slate-900 mb-2.5">Settings</div>
                  {/* Search Input Pill */}
                  <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200/70">
                    <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-800 w-full focus:outline-none"
                      placeholder={oem.settingsRootSearchHint}
                    />
                  </div>

                  {/* Quick Simulator Toggle */}
                  <div className="mt-2.5 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Simulate Device State:
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSimulatedAlreadyUnlocked(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          !simulatedAlreadyUnlocked
                            ? 'bg-[#F69220] text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Hidden (Default)
                      </button>
                      <button
                        onClick={() => setSimulatedAlreadyUnlocked(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          simulatedAlreadyUnlocked
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Unlocked
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Results Body */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  {simulatedAlreadyUnlocked ? (
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Search Results
                      </div>
                      <button
                        onClick={() => scrollToSection('phase-3')}
                        className="w-full text-left bg-white p-3 rounded-xl border border-emerald-200 shadow-xs hover:border-emerald-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">USB debugging</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Found
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {oem.devOptionsPath.join(' › ')}
                        </div>
                      </button>
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-center">
                        Great! Developer Options is already unlocked on your device. Proceed to Phase 3.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-3 space-y-2.5">
                      <div className="w-11 h-11 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        No results for "{searchQuery || 'USB debugging'}"
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Android hides Developer Options on new phones for security. Continue to <strong>Phase 2</strong> below to unlock it.
                      </p>
                    </div>
                  )}
                </div>
              </AndroidPhoneFrame>
            </div>
          </div>
        </section>

        {/* =====================================================================
            PHASE 2: ACTIVATE DEVELOPER OPTIONS (TAP BUILD NUMBER 7 TIMES)
        ===================================================================== */}
        <section
          id="phase-2"
          className="scroll-mt-24 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F69220] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#F69220]/30">
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F69220]">
                    Phase 2 • Unlock Hidden Menu
                  </span>
                </div>
                <h2 className="text-xl sm:text-xl font-bold text-slate-900 mt-0.5">
                  Activate Developer Options (Tap Build Number 7 Times)
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  If USB Debugging didn't appear in Phase 1, unlock Developer Options by tapping your device's build identifier seven times.
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStepComplete('step2')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                completedSteps.step2
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#F69220] hover:text-slate-900'
              }`}
            >
              {completedSteps.step2 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Unlocked</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span>Mark Unlocked</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Instructions */}
            <div className="lg:col-span-7 space-y-5">
              <ol className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Scroll to the bottom of <strong className="text-slate-900">Settings</strong> and tap{' '}
                    <strong className="text-slate-900">About phone</strong> (or <em>About tablet</em>).
                  </div>
                </li>

                {oem.hasSubMenuForBuild && (
                  <li className="flex items-start gap-3.5">
                    <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-sm text-slate-700 leading-relaxed">
                      On {oem.name}, tap <strong className="text-slate-900">{oem.subMenuName}</strong> to reveal the build details.
                    </div>
                  </li>
                )}

                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {oem.hasSubMenuForBuild ? '3' : '2'}
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Locate <strong className="text-slate-900">{oem.buildLabel}</strong> and tap it rapidly{' '}
                    <strong className="text-[#d97706]">7 times in a row</strong>. After 3 taps, a countdown toast will appear at the bottom of your screen (<em>"You are now 4 steps away from being a developer"</em>).
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {oem.hasSubMenuForBuild ? '4' : '3'}
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Enter your device's <strong className="text-slate-900">PIN, pattern, or password</strong> when prompted. You will see a confirmation message:{' '}
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-xs font-medium">
                      You are now a developer!
                    </span>
                  </div>
                </li>
              </ol>

              {/* Brand-Specific Tip Box */}
              <div className="p-4 rounded-xl bg-[#F69220]/10 border border-[#F69220]/25 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-[#F69220] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">{oem.name} Note:</strong>
                  {oem.extraTip}
                </div>
              </div>
            </div>

            {/* Right Interactive 7-Tap Simulator Phone */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidPhoneFrame
                badgeText="Try It Live"
                caption="Tap 'Build number' 7 times inside the phone screen"
              >
                {/* Header */}
                <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">
                      {oem.hasSubMenuForBuild ? oem.subMenuName : 'About phone'}
                    </span>
                  </div>
                  {(tapCount > 0 || developerUnlocked) && (
                    <button
                      onClick={resetStep2Simulator}
                      title="Reset simulator"
                      className="text-[10px] font-semibold text-slate-500 hover:text-[#F69220] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Settings List Items */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400">Android version</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">15 (Vanilla Ice Cream)</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400">Baseband version</div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">g5300q-240612-240719</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400">Kernel version</div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">6.1.75-android15-8</div>
                  </div>

                  {/* Interactive Build Number Row */}
                  <button
                    onClick={handleBuildNumberTap}
                    disabled={developerUnlocked}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all active:scale-[0.98] relative overflow-hidden ${
                      developerUnlocked
                        ? 'bg-emerald-50/80 border-emerald-400 cursor-default'
                        : 'bg-white border-[#F69220] shadow-sm shadow-[#F69220]/15 hover:bg-[#F69220]/5 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{oem.buildLabel}</span>
                          {!developerUnlocked && (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#F69220] animate-ping" />
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {oem.buildValue}
                        </div>
                      </div>

                      <div className="text-right">
                        {developerUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#F69220] text-white text-[10px] font-bold">
                            {tapCount === 0 ? 'Tap 7x' : `${tapCount}/7 taps`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Android Toast Notification */}
                {tapCount > 0 && !developerUnlocked && !showPinPrompt && (
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 text-white text-[11px] font-medium px-3.5 py-2 rounded-full text-center shadow-lg animate-fade-in">
                    {tapCount < 3
                      ? `Keep tapping... (${7 - tapCount} taps left)`
                      : `You are now ${7 - tapCount} step${7 - tapCount === 1 ? '' : 's'} away from being a developer.`}
                  </div>
                )}

                {developerUnlocked && (
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900 text-white text-[11px] font-semibold px-3.5 py-2 rounded-full text-center shadow-lg flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F69220]" />
                    <span>You are now a developer!</span>
                  </div>
                )}

                {/* Simulated Lock Screen PIN Modal */}
                {showPinPrompt && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-[2px] flex items-center justify-center p-4 z-10">
                    <div className="bg-white rounded-2xl p-4 w-full shadow-xl border border-slate-200 text-center space-y-3">
                      <div className="w-9 h-9 rounded-full bg-[#F69220]/15 text-[#F69220] flex items-center justify-center mx-auto">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Confirm your PIN</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Enter device PIN to enable Developer Options
                        </div>
                      </div>
                      <input
                        type="password"
                        maxLength={6}
                        value={enteredPin}
                        onChange={(e) => setEnteredPin(e.target.value)}
                        placeholder="••••"
                        className="w-full text-center tracking-[0.4em] font-bold text-sm py-1.5 px-3 rounded-lg border border-slate-300 focus:border-[#F69220] focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowPinPrompt(false);
                            setTapCount(6);
                          }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePinConfirm}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F69220] hover:bg-[#e08116]"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </AndroidPhoneFrame>
            </div>
          </div>
        </section>

        {/* =====================================================================
            PHASE 3: ENABLE USB DEBUGGING & AUTHORIZE PC
        ===================================================================== */}
        <section
          id="phase-3"
          className="scroll-mt-24 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F69220] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#F69220]/30">
                3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F69220]">
                    Phase 3 • Toggle & Authorize
                  </span>
                </div>
                <h2 className="text-xl sm:text-xl font-bold text-slate-900 mt-0.5">
                  Enable USB Debugging & Authorize Your Computer
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Now that Developer Options is visible, turn on USB Debugging and approve the RSA security prompt when plugging in your USB cable.
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleStepComplete('step3')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                completedSteps.step3
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#F69220] hover:text-slate-900'
              }`}
            >
              {completedSteps.step3 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span>Mark Enabled</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Instructions */}
            <div className="lg:col-span-7 space-y-5">
              <ol className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Go back to <strong className="text-slate-900">Settings</strong> and open{' '}
                    <span className="inline-flex flex-wrap items-center gap-1 font-semibold text-slate-900">
                      {oem.devOptionsPath.map((crumb, i) => (
                        <React.Fragment key={crumb}>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{crumb}</span>
                          {i < oem.devOptionsPath.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                    . Ensure the top master switch for <em>Use developer options</em> is <strong className="text-slate-900">ON</strong>.
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Scroll down to the <strong className="text-slate-900">Debugging</strong> section and toggle{' '}
                    <strong className="text-slate-900">USB debugging</strong> to <strong className="text-[#d97706]">ON</strong>. Tap <strong className="text-slate-900">OK</strong> on the confirmation popup.
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    Connect your Android phone to your computer with a <strong className="text-slate-900">data-capable USB cable</strong>. Unlock your phone screen.
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#F69220]/15 text-[#d97706] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    When the <strong className="text-slate-900">"Allow USB debugging?"</strong> prompt appears with your PC's RSA key fingerprint, check{' '}
                    <strong className="text-slate-900">Always allow from this computer</strong> and tap <strong className="text-[#d97706]">Allow</strong>.
                  </div>
                </li>
              </ol>

              {/* Security Reminder */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Security Best Practice:</strong>
                  Only tap <em>"Always allow from this computer"</em> on your own personal workstation. Never authorize USB debugging on public charging kiosks or untrusted computers.
                </div>
              </div>
            </div>

            {/* Right Interactive Toggle & RSA Dialog Phone */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidPhoneFrame
                badgeText="Interactive Switch"
                caption="Flip the USB debugging switch to test the RSA prompt"
              >
                {/* Header */}
                <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">Developer options</span>
                  </div>
                  {(usbDebuggingOn || pcAuthorized) && (
                    <button
                      onClick={resetStep3Simulator}
                      className="text-[10px] font-semibold text-slate-500 hover:text-[#F69220] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Master Toggle Banner */}
                <div className="mx-3 mt-3 px-3.5 py-2.5 rounded-2xl bg-[#F69220]/15 border border-[#F69220]/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Use developer options</span>
                  <div className="w-9 h-5 rounded-full bg-[#F69220] p-0.5 flex justify-end items-center">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* Debugging Section */}
                <div className="p-3 space-y-2.5 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#d97706] px-1 pt-1">
                    Debugging
                  </div>

                  {/* Interactive USB Debugging Toggle Row */}
                  <div
                    onClick={handleUsbToggleClick}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      usbDebuggingOn
                        ? 'bg-emerald-50/70 border-emerald-400'
                        : 'bg-white border-[#F69220] shadow-sm shadow-[#F69220]/10 hover:bg-[#F69220]/5'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">USB debugging</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Debug mode when USB is connected
                      </div>
                    </div>

                    {/* Animated Switch */}
                    <button
                      type="button"
                      aria-label="Toggle USB debugging"
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${
                        usbDebuggingOn ? 'bg-[#F69220] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Secondary Option: Revoke USB debugging authorizations */}
                  <div className="bg-white p-3 rounded-xl border border-slate-100 opacity-80">
                    <div className="text-xs font-semibold text-slate-800">
                      Revoke USB debugging authorizations
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Clear previously trusted computers
                    </div>
                  </div>

                  {/* Status Banner when Authorized */}
                  {pcAuthorized && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-600 text-white text-center space-y-1 shadow-sm">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>USB Debugging Active & Authorized!</span>
                      </div>
                      <div className="text-[10px] text-emerald-100">
                        Your PC can now communicate via ADB.
                      </div>
                    </div>
                  )}

                  {!usbDebuggingOn && (
                    <div className="text-center pt-2">
                      <span className="inline-block text-[10px] font-semibold text-[#d97706] bg-[#F69220]/10 px-2.5 py-1 rounded-full">
                        Tap the switch above to enable
                      </span>
                    </div>
                  )}
                </div>

                {/* Modal 1: "Allow USB debugging?" Confirmation */}
                {showConfirmModal && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center p-4 z-10">
                    <div className="bg-white rounded-2xl p-4 w-full shadow-xl border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-900">Allow USB debugging?</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        USB debugging is intended for development purposes only. Use it to copy data between your computer and your device, install apps without notification, and read log data.
                      </p>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowConfirmModal(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmEnableUsbDebugging}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F69220] hover:bg-[#e08116]"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal 2: RSA Key Fingerprint Prompt when USB is plugged in */}
                {showRsaDialog && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-[2px] flex items-center justify-center p-3.5 z-20">
                    <div className="bg-white rounded-2xl p-4 w-full shadow-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F69220]/15 text-[#F69220] flex items-center justify-center shrink-0">
                          <Usb className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          Allow USB debugging?
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        <div className="text-[10px] text-slate-500">
                          The computer's RSA key fingerprint is:
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-800 mt-0.5 break-all">
                          8F:3C:91:A4:02:E7:5B:19:D4:6A:C0:11
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={alwaysAllowPc}
                          onChange={(e) => setAlwaysAllowPc(e.target.checked)}
                          className="rounded border-slate-300 text-[#F69220] focus:ring-[#F69220]"
                        />
                        <span className="text-[11px] font-medium text-slate-700">
                          Always allow from this computer
                        </span>
                      </label>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowRsaDialog(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRsaAllow}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F69220] hover:bg-[#e08116]"
                        >
                          Allow
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </AndroidPhoneFrame>
            </div>
          </div>
        </section>

        {/* =====================================================================
            QUICK VERIFICATION & TROUBLESHOOTING CHECKLIST
        ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Terminal Verification Card */}
          {/*<div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">*/}
          {/*  <div>*/}
          {/*    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-3">*/}
          {/*      <Terminal className="w-3.5 h-3.5 text-[#F69220]" />*/}
          {/*      <span>Verify Connection on PC</span>*/}
          {/*    </div>*/}
          {/*    <h3 className="text-lg font-bold text-slate-900">*/}
          {/*      Test with <code className="text-[#F69220]">adb devices</code>*/}
          {/*    </h3>*/}
          {/*    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">*/}
          {/*      Open Terminal (macOS/Linux) or Command Prompt / PowerShell (Windows) where Android Platform Tools are installed, and run:*/}
          {/*    </p>*/}

          {/*    /!* Terminal Box *!/*/}
          {/*    <div className="mt-4 rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-xs border border-slate-800">*/}
          {/*      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">*/}
          {/*        <div className="flex items-center gap-1.5">*/}
          {/*          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />*/}
          {/*          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />*/}
          {/*          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />*/}
          {/*          <span className="text-[10px] text-slate-400 ml-1.5">terminal</span>*/}
          {/*        </div>*/}
          {/*        <button*/}
          {/*          onClick={handleCopyAdb}*/}
          {/*          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition-colors"*/}
          {/*        >*/}
          {/*          {copiedCmd ? (*/}
          {/*            <>*/}
          {/*              <Check className="w-3 h-3 text-emerald-400" />*/}
          {/*              <span className="text-emerald-400">Copied</span>*/}
          {/*            </>*/}
          {/*          ) : (*/}
          {/*            <>*/}
          {/*              <Copy className="w-3 h-3" />*/}
          {/*              <span>Copy</span>*/}
          {/*            </>*/}
          {/*          )}*/}
          {/*        </button>*/}
          {/*      </div>*/}
          {/*      <div className="space-y-1.5">*/}
          {/*        <div>*/}
          {/*          <span className="text-[#F69220] select-none">$ </span>*/}
          {/*          <span className="font-semibold text-white">adb devices</span>*/}
          {/*        </div>*/}
          {/*        <div className="text-slate-400 pt-1">List of devices attached</div>*/}
          {/*        <div className="flex items-center gap-3">*/}
          {/*          <span className="text-slate-200">3A141FDH20089X</span>*/}
          {/*          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">*/}
          {/*            device*/}
          {/*          </span>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </div>*/}

          {/*  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">*/}
          {/*    If status says <code className="text-amber-600 font-semibold">unauthorized</code>, unlock your phone screen and tap <strong>Allow</strong> on the RSA dialog.*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/* Troubleshooting Checklist Card */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F69220]/10 text-[#d97706] text-xs font-bold mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F69220]" />
              <span>Troubleshooting Checklist</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Phone Not Showing Up? Check These 4 Things
            </h3>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#F69220]/15 text-[#F69220] flex items-center justify-center font-extrabold text-[11px]">
                    1
                  </span>
                  <span>Use a Data-Capable Cable</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Many cheap charging cables only have power wires. Try the original cable that came with your phone or a verified USB-C data cable.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#F69220]/15 text-[#F69220] flex items-center justify-center font-extrabold text-[11px]">
                    2
                  </span>
                  <span>Switch USB Mode to File Transfer</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Swipe down your notification shade, tap <em>"Charging this device via USB"</em>, and select <strong>File Transfer / Android Auto (MTP)</strong> or <strong>PTP</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#F69220]/15 text-[#F69220] flex items-center justify-center font-extrabold text-[11px]">
                    3
                  </span>
                  <span>Revoke & Re-Authorize RSA Keys</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  If the prompt never pops up, tap <strong>Revoke USB debugging authorizations</strong> inside Developer Options, unplug, and reconnect the cable.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#F69220]/15 text-[#F69220] flex items-center justify-center font-extrabold text-[11px]">
                    4
                  </span>
                  <span>Windows OEM USB Drivers</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  On Windows PCs, you may need to install Google USB Driver (via Android Studio) or Samsung/OEM USB drivers for Device Manager to recognize ADB.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F69220]" />
            <span>Android Developer Setup Guide</span>
          </div>
          <div>
            Tip: Remember to turn off USB Debugging when you no longer need it for maximum device security.
          </div>
        </div>
      </footer>
    </div>
  );
}