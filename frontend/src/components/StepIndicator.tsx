import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: 'Select Repo' },
    { number: 2, title: 'Map Authors' },
    { number: 3, title: 'Preview & Rewrite' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-700 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isPast = currentStep > step.number;
          
          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-lg
                  ${isActive ? 'bg-blue-500 text-white shadow-blue-500/50 scale-110' : 
                    isPast ? 'bg-blue-400 text-white' : 'bg-gray-800 text-gray-400 border-2 border-gray-700'}`}
              >
                {isPast ? <Check size={20} /> : step.number}
              </div>
              <span className={`absolute -bottom-7 whitespace-nowrap text-xs font-medium transition-colors duration-300
                ${isActive ? 'text-blue-400' : isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
