import {useState} from "react";
import { CheckCircle, Download, Folder, Terminal, Copy, ClipboardCheck, RefreshCw, AlertTriangle, ChevronRight } from "lucide-react";

// Mock Button component to make the code runnable as a standalone file
const Button = ({ text, status, onClick }) => {
  const baseStyles = "px-4 py-2 rounded-lg text-[12px] font-medium transition-all flex items-center gap-2";
  const variants = {
    // Updated primary color to #F69220
    active: "bg-[#F69220] text-white hover:bg-[#e07f10] shadow-sm",
    cancel: "bg-gray-100 text-gray-600 hover:bg-gray-200"
  };
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[status] || variants.cancel}`}>
      {text}
    </button>
  );
};

const CodeBlock = ({ code, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative mt-2">
      {label && <div className="text-[10px] text-gray-400 mb-1 font-mono uppercase tracking-tight">{label}</div>}
      <div className="bg-gray-900 text-orange-200 p-3 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto pr-10">
        {code}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
        title="Copy code"
      >
        {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-[#F69220]"/> : <Copy className="w-3.5 h-3.5"/>}
      </button>
    </div>
  );
};

export default function Adb() {
    const [step, setStep] = useState(0);

    const winCommand = `$oldPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    
    [System.Environment]::SetEnvironmentVariable(
    "Path",
    $oldPath + ";C:\\platform-tools",
    "Machine"
    )`;

    const steps = [
    {
      title: "Download ADB Tools",
      description: "Get the official SDK Platform-Tools for your operating system.",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <a
              href="https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-orange-100 text-[#F69220] hover:border-[#F69220] transition-all text-[12px] font-medium group"
            >
              <span className="flex items-center gap-3"><Download className="w-4 h-4" /> Windows (.zip)</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="https://dl.google.com/android/repository/platform-tools-latest-darwin.zip"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 text-gray-700 hover:border-[#F69220] transition-all text-[12px] font-medium group"
            >
              <span className="flex items-center gap-3"><Download className="w-4 h-4" /> macOS (.zip)</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      ),
    },
    {
      title: "Extract and Move",
      description: "Move the folder to a permanent location on your drive.",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-900">
            <p className="font-bold flex items-center gap-2 mb-2"><Folder className="w-4 h-4" /> Windows Instructions:</p>
            <ol className="list-decimal ml-4 space-y-1.5 leading-relaxed">
              <li>Unzip the downloaded file.</li>
              <li>Move the <code className="bg-amber-100 px-1 rounded font-bold">platform-tools</code> folder to your <span className="font-bold">C:\</span> drive.</li>
              <li>Final path: <code className="bg-amber-100 px-1 rounded font-bold">C:\platform-tools</code></li>
            </ol>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700">
            <p className="font-bold flex items-center gap-2 mb-2"><Folder className="w-4 h-4" /> macOS Instructions:</p>
            <ol className="list-decimal ml-4 space-y-1.5 leading-relaxed">
              <li>Unzip the file.</li>
              <li>Move the folder to your user directory: <code className="bg-slate-200 px-1 rounded font-bold">~/platform-tools</code></li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      title: "Add to System PATH",
      description: "Allow your system to find the ADB commands.",
      content: (
        <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
          {/* Windows Section */}
          <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
            <p className="text-[12px] font-bold text-[#F69220] mb-2 flex items-center gap-2">
               Windows (PowerShell Admin)
            </p>
            <p className="text-[10px] text-orange-800 mb-2">Run PowerShell as Administrator and paste:</p>
            <CodeBlock code={winCommand} />
          </div>

          {/* macOS Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[12px] font-bold text-slate-900 mb-2 flex items-center gap-2">
               macOS (Terminal)
            </p>
            <div className="space-y-3 text-[10px] text-slate-600 leading-relaxed">
              <div>
                <span className="font-bold block text-slate-800">1. Check your Shell:</span>
                <CodeBlock code="echo $SHELL" />
                <p className="mt-1">If it says <code className="font-bold">/bin/zsh</code>, edit <code className="font-bold">.zshrc</code>. If <code className="font-bold">/bin/bash</code>, edit <code className="font-bold">.bash_profile</code>.</p>
              </div>
              <div>
                <span className="font-bold block text-slate-800">2. Open config file:</span>
                <CodeBlock code="nano ~/.zshrc" label="Use ~/.bash_profile for bash" />
              </div>
              <div>
                <span className="font-bold block text-slate-800">3. Add this line & Save (Ctrl+O, Enter, Ctrl+X):</span>
                <CodeBlock code='export PATH="$PATH:$HOME/platform-tools"' />
              </div>
              <div>
                <span className="font-bold block text-slate-800">4. Apply changes:</span>
                <CodeBlock code="source ~/.zshrc" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Verify Installation",
      description: "Confirm ADB is working correctly.",
      content: (
        <div className="space-y-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-[12px]">
            <ol className="list-decimal ml-4 space-y-3 text-slate-700 font-medium">
              <li><span className="text-red-600 font-bold underline">Close</span> all current terminal or PowerShell windows.</li>
              <li>Open a <span className="font-bold">new</span> terminal window.</li>
              <li>Run the verification command:</li>
            </ol>
            <CodeBlock code="adb version" />
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-[11px] text-green-700 flex gap-2 items-center">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#F69220]" />
              <span>You should see "Android Debug Bridge version..." returned.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Restart Application",
      description: "Final step to refresh the app's environment.",
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-[#F69220] p-3 rounded-full mb-3 shadow-lg shadow-orange-200">
              <RefreshCw className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <p className="font-bold text-orange-900 text-[14px]">Restart the Desktop App</p>
            <p className="text-orange-800 mt-2 text-[12px] leading-relaxed">
              Please close this desktop application completely and then open it again to apply all environmental changes.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-[11px]">
              <p className="font-bold text-amber-800">Did the setup reappear?</p>
              <p className="text-amber-700 mt-1 leading-relaxed">
                If this guide shows up again after restarting, the system cannot find ADB. Please <span className="font-bold underline">redo the steps</span>, checking that the folder location matches your PATH command exactly.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

    const current = steps[step];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-md">
            <div className="w-[40vw] bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-black/5 shadow-2xl ring-1 ring-black/5">
                {/* Header/Progress */}
                <div className="bg-slate-50 p-6 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-[14px] font-bold tracking-tight">ADB Environment Setup</h1>
                    <div className="flex gap-1.5">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#F69220]' : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Follow these steps to setup Android Debug Bridge so that your mobile device can communicate with this desktop app
                  </p>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                  <div className="mb-6">
                    <span className="inline-block px-2 py-1 rounded-full bg-orange-100 text-[#F69220] text-[10px] font-bold uppercase tracking-wider mb-2">
                      Step {step + 1} of {steps.length}
                    </span>
                    <h2 className="text-[12px] font-bold text-slate-800">{current.title}</h2>
                    <p className="text-[11px] text-slate-500 mt-1">{current.description}</p>
                  </div>

                  <div className="min-h-[260px]">
                    {current.content}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center mt-10">
                    <Button
                      text="Back"
                      status="cancel"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                    />
                    <Button
                      text={step === steps.length - 1 ? "Finish Setup" : "Continue"}
                      status="active"
                      onClick={() => {
                        if (step < steps.length - 1) {
                          setStep((s) => s + 1);
                        }
                      }}
                    />
                  </div>
                </div>
            </div>
            <style>{`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 8s linear infinite;
            }
          `}</style>
        </div>
    )
}