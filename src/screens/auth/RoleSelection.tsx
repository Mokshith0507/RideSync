import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UserRole } from '@/types';

export function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    sessionStorage.setItem('selectedRole', selectedRole);
    navigate('/login');
  };

  const roles: {
    id: UserRole;
    label: string;
    description: string;
    icon: typeof Bike;
    iconColor: string;
    iconBg: string;
    selectedBg: string;
    selectedBorder: string;
  }[] = [
    {
      id: 'driver',
      label: 'Driver',
      description: 'I ride a bike and offer rides to passengers',
      icon: Bike,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      selectedBg: 'bg-blue-50 dark:bg-blue-500/10',
      selectedBorder: 'border-blue-500 dark:border-blue-400',
    },
    {
      id: 'passenger',
      label: 'Passenger',
      description: 'I board bikes and travel to destinations',
      icon: User,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      selectedBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      selectedBorder: 'border-emerald-500 dark:border-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-4 shadow-lg">
            <img
            src="/ridesync-logo.jpg"
            alt="RideSync"
            className="w-9 h-9 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-black dark:text-white">
            Select Your Role
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            How do you want to use RideSync?
          </p>

        </div>

        {/* Role Cards */}
        <div className="space-y-4">

          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `${role.selectedBg} ${role.selectedBorder} shadow-md`
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 hover:shadow-sm'
                }`}
              >

                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${role.iconBg}`}
                >
                  <Icon
                    size={24}
                    className={role.iconColor}
                  />
                </div>

                {/* Text */}
                <div className="flex-1">

                  <p className="font-bold text-black dark:text-white">
                    {role.label}
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {role.description}
                  </p>

                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      role.id === 'driver'
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 1.414 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

              </button>
            );
          })}

        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/')}
            className="
              flex-1
              bg-slate-100
              text-slate-900
              hover:bg-slate-200
              dark:bg-white/10
              dark:text-white
              dark:hover:bg-white/20
              border-0
            "
          >
            <ArrowLeft className="mr-1.5" size={18} />
            Back
          </Button>

          <Button
            size="lg"
            disabled={!selectedRole}
            onClick={handleContinue}
            className="
              flex-1
              bg-black
              text-white
              hover:bg-slate-800
              dark:bg-white
              dark:text-black
              dark:hover:bg-slate-200
              disabled:opacity-40
              border-0
            "
          >
            Continue
            <ArrowRight className="ml-2" size={18} />
          </Button>

        </div>

      </div>
    </div>
  );
}