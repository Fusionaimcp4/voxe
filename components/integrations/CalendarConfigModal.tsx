"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Check, X, ExternalLink, Loader2, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import { notifications } from "@/lib/notifications";
import { CalendarSchedulingSettings } from "@/lib/integrations/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface CalendarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  existingIntegration?: {
    id: string;
    name: string;
    configuration: any;
  };
}

interface CalendarStatus {
  connected: boolean;
  provider?: string;
  accountEmail?: string;
  calendarId?: string;
  timezone?: string;
  enabledForChatScheduling?: boolean;
  connectionStatus?: {
    isConnected: boolean;
    lastChecked?: string;
    errorMessage?: string;
  };
}

export function CalendarConfigModal({ isOpen, onClose, onRefresh, existingIntegration }: CalendarConfigModalProps) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [enabledForChatScheduling, setEnabledForChatScheduling] = useState(false);
  const [showOAuthForm, setShowOAuthForm] = useState(false);
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scheduling'>('overview');
  const [savingSettings, setSavingSettings] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  
  // Scheduling settings state
  const [schedulingSettings, setSchedulingSettings] = useState<CalendarSchedulingSettings>({
    timezone: 'America/Chicago',
    daysAhead: 14,
    slotDurationMinutes: 30,
    slotInterval: 30,
    maxSlots: 3,
    skipPastTimeToday: true,
    businessHours: {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '17:00'],
    },
    closedDays: ['sat', 'sun'],
    holidayDates: [],
    bufferMinutesBetweenMeetings: 15,
    maxBookingsPerDay: 10,
    maxBookingsPerWeek: 40,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCalendarStatus().then((data) => {
        // Load scheduling settings from n8n after status is fetched
        // Only load if calendar is connected
        if (data?.connected || existingIntegration) {
          loadSchedulingSettingsFromN8n();
        }
      });
      // Set active tab based on whether we're configuring
      if (existingIntegration) {
        setActiveTab('scheduling');
      }
    }
  }, [isOpen, existingIntegration]);

  // Get all IANA timezones grouped by continent
  const timezones = useMemo(() => {
    try {
      // Use Intl.supportedValuesOf if available (modern browsers)
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        const allTimezones = (Intl as any).supportedValuesOf('timeZone') as string[];
        // Group by continent
        const grouped: Record<string, string[]> = {};
        allTimezones.forEach(tz => {
          const continent = tz.split('/')[0];
          if (!grouped[continent]) {
            grouped[continent] = [];
          }
          grouped[continent].push(tz);
        });
        // Sort each group
        Object.keys(grouped).forEach(key => {
          grouped[key].sort();
        });
        return grouped;
      }
    } catch (e) {
      // Fallback if not supported
    }
    
    // Fallback: comprehensive list of common IANA timezones
    const commonTimezones: Record<string, string[]> = {
      'Africa': [
        'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
        'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
        'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
        'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
        'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
        'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
        'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
        'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
        'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
        'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
        'Africa/Tunis', 'Africa/Windhoek'
      ],
      'America': [
        'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
        'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
        'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
        'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
        'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
        'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
        'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
        'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
        'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
        'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
        'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
        'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
        'America/Glace_Bay', 'America/Godthab', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada',
        'America/Guadeloupe', 'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax',
        'America/Havana', 'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox',
        'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Tell_City',
        'America/Indiana/Vevay', 'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Inuvik',
        'America/Iqaluit', 'America/Jamaica', 'America/Juneau', 'America/Kentucky/Louisville',
        'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz', 'America/Lima',
        'America/Los_Angeles', 'America/Lower_Princes', 'America/Maceio', 'America/Managua', 'America/Manaus',
        'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan', 'America/Menominee',
        'America/Merida', 'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon', 'America/Moncton',
        'America/Monterrey', 'America/Montevideo', 'America/Montserrat', 'America/Nassau', 'America/New_York',
        'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
        'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga',
        'America/Panama', 'America/Pangnirtung', 'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince',
        'America/Port_of_Spain', 'America/Porto_Velho', 'America/Puerto_Rico', 'America/Punta_Arenas',
        'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife', 'America/Regina', 'America/Resolute',
        'America/Rio_Branco', 'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
        'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns', 'America/St_Kitts',
        'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent', 'America/Swift_Current', 'America/Tegucigalpa',
        'America/Thule', 'America/Thunder_Bay', 'America/Tijuana', 'America/Toronto', 'America/Tortola',
        'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife'
      ],
      'Asia': [
        'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe', 'Asia/Ashgabat',
        'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut',
        'Asia/Bishkek', 'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus', 'Asia/Dhaka',
        'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta', 'Asia/Gaza', 'Asia/Hebron', 'Asia/Ho_Chi_Minh',
        'Asia/Hong_Kong', 'Asia/Hovd', 'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul',
        'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga', 'Asia/Kolkata', 'Asia/Krasnoyarsk',
        'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau', 'Asia/Magadan', 'Asia/Makassar',
        'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia', 'Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk',
        'Asia/Oral', 'Asia/Phnom_Penh', 'Asia/Pontianak', 'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qostanay',
        'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin', 'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai',
        'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent', 'Asia/Tbilisi', 'Asia/Tehran',
        'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar', 'Asia/Urumqi', 'Asia/Ust-Nera',
        'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yangon', 'Asia/Yekaterinburg', 'Asia/Yerevan'
      ],
      'Atlantic': [
        'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
        'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena', 'Atlantic/Stanley'
      ],
      'Australia': [
        'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie', 'Australia/Darwin',
        'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe', 'Australia/Melbourne',
        'Australia/Perth', 'Australia/Sydney'
      ],
      'Europe': [
        'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade',
        'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest',
        'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
        'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
        'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon', 'Europe/Ljubljana',
        'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
        'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica',
        'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo',
        'Europe/Saratov', 'Europe/Simferopol', 'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm',
        'Europe/Tallinn', 'Europe/Tirane', 'Europe/Ulyanovsk', 'Europe/Uzhgorod', 'Europe/Vaduz',
        'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw',
        'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich'
      ],
      'Indian': [
        'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro',
        'Indian/Kerguelen', 'Indian/Mahe', 'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte',
        'Indian/Reunion'
      ],
      'Pacific': [
        'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham', 'Pacific/Chuuk',
        'Pacific/Easter', 'Pacific/Efate', 'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti',
        'Pacific/Galapagos', 'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
        'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro', 'Pacific/Marquesas',
        'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue', 'Pacific/Norfolk', 'Pacific/Noumea',
        'Pacific/Pago_Pago', 'Pacific/Palau', 'Pacific/Pitcairn', 'Pacific/Pohnpei', 'Pacific/Port_Moresby',
        'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
        'Pacific/Wake', 'Pacific/Wallis'
      ]
    };
    return commonTimezones;
  }, []);

  // Load scheduling settings from n8n
  const loadSchedulingSettingsFromN8n = async () => {
    try {
      const response = await fetch('/api/calendar/settings');
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings && Object.keys(data.settings).length > 0) {
          // Merge loaded settings with defaults
          setSchedulingSettings(prev => ({
            ...prev,
            ...data.settings,
          }));
          console.log('✅ Loaded scheduling settings from n8n:', data.settings);
        } else if (data.warning) {
          console.warn('⚠️', data.warning);
        }
      } else {
        const error = await response.json();
        console.warn('Could not load settings from n8n:', error.error || 'Unknown error');
        // Don't show error to user - just use defaults
      }
    } catch (error) {
      console.error('Failed to load scheduling settings from n8n:', error);
      // Don't show error to user - just use defaults
    }
  };

  const fetchCalendarStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/integrations/calendar');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setEnabledForChatScheduling(data.enabledForChatScheduling || false);
        return data; // Return data so useEffect can use it
      } else {
        const error = await response.json();
        notifications.error(error.error || 'Failed to fetch calendar status');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
      notifications.error('Failed to fetch calendar status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    // Check if user needs to provide OAuth credentials
    const response = await fetch('/api/dashboard/integrations/calendar/google/check-credentials');
    const data = await response.json();
    
    if (data.needsCredentials) {
      // Show form to enter credentials
      setShowOAuthForm(true);
    } else {
      // Use system credentials, proceed directly
      window.location.href = '/api/dashboard/integrations/calendar/google/connect';
    }
  };

  const handleSaveOAuthCredentials = async () => {
    if (!oauthClientId.trim() || !oauthClientSecret.trim()) {
      notifications.error('Please enter both Client ID and Client Secret');
      return;
    }

    try {
      setSavingCredentials(true);
      
      // Save credentials to integration (create or update)
      const integrationsResponse = await fetch('/api/dashboard/integrations');
      if (integrationsResponse.ok) {
        const integrationsData = await integrationsResponse.json();
        const calendarIntegration = integrationsData.integrations.find(
          (i: any) => i.type === 'CALENDAR'
        );

        const config = {
          provider: 'GOOGLE_CALENDAR',
          oauthClientId: oauthClientId.trim(),
          oauthClientSecret: oauthClientSecret.trim(),
        };

        if (calendarIntegration) {
          // Update existing integration
          const response = await fetch(`/api/dashboard/integrations/${calendarIntegration.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              configuration: {
                ...calendarIntegration.configuration,
                ...config,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save credentials');
          }
        } else {
          // Create new integration with credentials
          const response = await fetch('/api/dashboard/integrations/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Google Calendar',
              type: 'CALENDAR',
              configuration: config,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save credentials');
          }
        }

        // Now proceed with OAuth flow
        window.location.href = '/api/dashboard/integrations/calendar/google/connect';
      }
    } catch (error) {
      console.error('Failed to save OAuth credentials:', error);
      notifications.error('Failed to save credentials. Please try again.');
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = await notifications.confirm(
      'Are you sure you want to disconnect your calendar? This will prevent Voxe from booking meetings and disable calendar nodes in your workflows.'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setDisconnecting(true);
      
      // Find and deactivate the calendar integration
      const integrationsResponse = await fetch('/api/dashboard/integrations');
      if (integrationsResponse.ok) {
        const data = await integrationsResponse.json();
        const calendarIntegration = data.integrations.find(
          (i: any) => i.type === 'CALENDAR'
        );

        if (calendarIntegration) {
          // Deactivate the integration
          const response = await fetch(`/api/dashboard/integrations/${calendarIntegration.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isActive: false,
            }),
          });

          if (response.ok) {
            // Disable calendar nodes in n8n workflows
            try {
              const toggleResponse = await fetch('/api/dashboard/integrations/calendar/toggle-nodes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  disabled: true,
                }),
              });

              if (!toggleResponse.ok) {
                console.warn('Failed to disable calendar nodes in n8n workflows (non-critical)');
              }
            } catch (toggleError) {
              console.error('Error disabling calendar nodes:', toggleError);
              // Don't fail the entire disconnect if n8n update fails
            }

            notifications.success('Calendar disconnected successfully. Calendar nodes have been disabled in your workflows.');
            await fetchCalendarStatus();
            onRefresh?.();
          } else {
            const error = await response.json();
            notifications.error(error.error || 'Failed to disconnect calendar');
          }
        }
      }
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      notifications.error('Failed to disconnect calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleToggleScheduling = async () => {
    const newValue = !enabledForChatScheduling;
    
    try {
      // Find the calendar integration
      const integrationsResponse = await fetch('/api/dashboard/integrations');
      if (integrationsResponse.ok) {
        const data = await integrationsResponse.json();
        const calendarIntegration = data.integrations.find(
          (i: any) => i.type === 'CALENDAR'
        );

        if (calendarIntegration) {
          const updatedConfig = {
            ...calendarIntegration.configuration,
            enabledForChatScheduling: newValue,
          };

          const response = await fetch(`/api/dashboard/integrations/${calendarIntegration.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              configuration: updatedConfig,
            }),
          });

          if (response.ok) {
            setEnabledForChatScheduling(newValue);
            notifications.success(
              newValue 
                ? 'Chat scheduling enabled' 
                : 'Chat scheduling disabled'
            );
          } else {
            const error = await response.json();
            notifications.error(error.error || 'Failed to update setting');
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle scheduling:', error);
      notifications.error('Failed to update setting');
    }
  };

  const handleSaveSchedulingSettings = async () => {
    try {
      setSavingSettings(true);
      
      // Save to n8n (single source of truth)
      const response = await fetch(`/api/calendar/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: schedulingSettings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        notifications.success('Scheduling settings saved successfully to n8n');
        
        // Reload settings from n8n to confirm they match
        await loadSchedulingSettingsFromN8n();
        
        // Note: Database is already updated by POST /api/calendar/settings endpoint
        // No need for additional backward compatibility call
        
        await fetchCalendarStatus();
        onRefresh?.();
      } else {
        const error = await response.json();
        notifications.error(error.error || 'Failed to save settings to n8n');
      }
    } catch (error) {
      console.error('Failed to save scheduling settings:', error);
      notifications.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Calendar Integration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : !status?.connected ? (
          // Not Connected State
          <div className="space-y-6">
            {!showOAuthForm ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Connect Your Google Calendar
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Connect your Google Calendar so Voxe can book meetings directly from chat.
                  </p>
                  <button
                    onClick={handleConnectGoogle}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Connect Google Calendar
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Google OAuth Credentials
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Enter your Google OAuth Client ID and Client Secret. You can get these from the{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                  .
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={oauthClientId}
                      onChange={(e) => setOauthClientId(e.target.value)}
                      placeholder="xxxxx.apps.googleusercontent.com"
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={oauthClientSecret}
                      onChange={(e) => setOauthClientSecret(e.target.value)}
                      placeholder="Enter your client secret"
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Redirect URI :</strong>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-white dark:bg-slate-800 p-2 rounded mt-1 break-all">
                    https://voxe.mcp4.ai/api/dashboard/integrations/calendar/google/callback
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      ⚠️ <strong>Important:</strong> Copy this exact URI and add it to your Google Cloud Console OAuth credentials under "Authorized redirect URIs".
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowOAuthForm(false)}
                      className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveOAuthCredentials}
                      disabled={savingCredentials || !oauthClientId.trim() || !oauthClientSecret.trim()}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingCredentials ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save & Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                What you'll get:
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>AI can check your availability and suggest meeting times</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Automatically book meetings from chat conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Send calendar invites with Google Meet links</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          // Connected State
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Connected to Google Calendar
                </span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Your calendar is connected and ready to use.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('scheduling')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'scheduling'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <SettingsIcon className="w-4 h-4 inline mr-1" />
                Scheduling Configuration
              </button>
            </div>

            {activeTab === 'overview' ? (
              // Overview Tab Content
              <>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Provider
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {status.provider === 'GOOGLE_CALENDAR' ? 'Google Calendar' : status.provider}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account Email
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {status.accountEmail}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Calendar ID
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1 font-mono text-xs">
                    {status.calendarId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Timezone
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {status.timezone}
                  </p>
                </div>
              </div>

              {status.connectionStatus && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Connection Status
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      status.connectionStatus.isConnected 
                        ? 'bg-emerald-500' 
                        : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {status.connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {status.connectionStatus.lastChecked && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (Last checked: {new Date(status.connectionStatus.lastChecked).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Chat Scheduling
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Allow AI to book meetings from chat conversations
                  </p>
                </div>
                <button
                  onClick={handleToggleScheduling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabledForChatScheduling ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabledForChatScheduling ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disconnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </span>
                ) : (
                  'Disconnect'
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
              </>
            ) : (
              // Scheduling Configuration Tab
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Configure Available Time Slots
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Customize how the AI determines available meeting times and booking limits.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Timezone
                    </label>
                    <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100 flex items-center justify-between"
                        >
                          <span className={schedulingSettings.timezone ? '' : 'text-slate-500'}>
                            {schedulingSettings.timezone || 'Select timezone...'}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            {Object.entries(timezones).map(([continent, tzList]) => (
                              <CommandGroup key={continent} heading={continent}>
                                {tzList.map((tz) => (
                                  <CommandItem
                                    key={tz}
                                    value={tz}
                                    onSelect={() => {
                                      setSchedulingSettings(prev => ({ ...prev, timezone: tz }));
                                      setTimezoneOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`
                                        mr-2 h-4 w-4
                                        ${schedulingSettings.timezone === tz ? 'opacity-100' : 'opacity-0'}
                                      `}
                                    />
                                    {tz}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      IANA timezone identifier (e.g., America/Chicago, Europe/London)
                    </p>
                  </div>

                  {/* Days Ahead */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Days Ahead
                    </label>
                    <input
                      type="number"
                      value={schedulingSettings.daysAhead || 14}
                      onChange={(e) => setSchedulingSettings(prev => ({ ...prev, daysAhead: parseInt(e.target.value) || 14 }))}
                      min="1"
                      max="90"
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      How many days in advance to show available slots
                    </p>
                  </div>

                  {/* Slot Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Slot Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={schedulingSettings.slotDurationMinutes || 30}
                        onChange={(e) => setSchedulingSettings(prev => ({ ...prev, slotDurationMinutes: parseInt(e.target.value) || 30 }))}
                        min="15"
                        max="480"
                        step="15"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Slot Interval (minutes)
                      </label>
                      <input
                        type="number"
                        value={schedulingSettings.slotInterval || 30}
                        onChange={(e) => setSchedulingSettings(prev => ({ ...prev, slotInterval: parseInt(e.target.value) || 30 }))}
                        min="15"
                        max="480"
                        step="15"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Max Slots */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Max Slots to Return
                    </label>
                    <input
                      type="number"
                      value={schedulingSettings.maxSlots || 3}
                      onChange={(e) => setSchedulingSettings(prev => ({ ...prev, maxSlots: parseInt(e.target.value) || 3 }))}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Maximum number of available time slots to return to the AI
                    </p>
                  </div>

                  {/* Skip Past Time Today */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <div>
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Skip Past Time Today
                      </label>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Don't show time slots that have already passed today
                      </p>
                    </div>
                    <button
                      onClick={() => setSchedulingSettings(prev => ({ ...prev, skipPastTimeToday: !prev.skipPastTimeToday }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        schedulingSettings.skipPastTimeToday ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          schedulingSettings.skipPastTimeToday ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Business Hours */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Business Hours
                    </label>
                    <div className="space-y-2">
                      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                        const dayHours = schedulingSettings.businessHours?.[day as keyof typeof schedulingSettings.businessHours];
                        return (
                          <div key={day} className="flex items-center gap-3">
                            <div className="w-20 text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                              {day}
                            </div>
                            <input
                              type="time"
                              value={dayHours?.[0] || '09:00'}
                              onChange={(e) => setSchedulingSettings(prev => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [day]: [e.target.value, prev.businessHours?.[day as keyof typeof prev.businessHours]?.[1] || '17:00'],
                                },
                              }))}
                              className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                            />
                            <span className="text-slate-500">to</span>
                            <input
                              type="time"
                              value={dayHours?.[1] || '17:00'}
                              onChange={(e) => setSchedulingSettings(prev => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [day]: [prev.businessHours?.[day as keyof typeof prev.businessHours]?.[0] || '09:00', e.target.value],
                                },
                              }))}
                              className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Closed Days */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Closed Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                        const isClosed = schedulingSettings.closedDays?.includes(day);
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              const currentClosed = schedulingSettings.closedDays || [];
                              setSchedulingSettings(prev => ({
                                ...prev,
                                closedDays: isClosed
                                  ? currentClosed.filter(d => d !== day)
                                  : [...currentClosed, day],
                              }));
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              isClosed
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buffer Minutes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Buffer Minutes Between Meetings
                    </label>
                    <input
                      type="number"
                      value={schedulingSettings.bufferMinutesBetweenMeetings || 15}
                      onChange={(e) => setSchedulingSettings(prev => ({ ...prev, bufferMinutesBetweenMeetings: parseInt(e.target.value) || 15 }))}
                      min="0"
                      max="120"
                      step="5"
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Minimum time gap between consecutive meetings
                    </p>
                  </div>

                  {/* Booking Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Max Bookings Per Day
                      </label>
                      <input
                        type="number"
                        value={schedulingSettings.maxBookingsPerDay || 10}
                        onChange={(e) => setSchedulingSettings(prev => ({ ...prev, maxBookingsPerDay: parseInt(e.target.value) || 10 }))}
                        min="1"
                        max="100"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Max Bookings Per Week
                      </label>
                      <input
                        type="number"
                        value={schedulingSettings.maxBookingsPerWeek || 40}
                        onChange={(e) => setSchedulingSettings(prev => ({ ...prev, maxBookingsPerWeek: parseInt(e.target.value) || 40 }))}
                        min="1"
                        max="500"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Holiday Dates */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Holiday Dates (ISO format, one per line)
                    </label>
                    <textarea
                      value={(schedulingSettings.holidayDates || []).join('\n')}
                      onChange={(e) => {
                        const dates = e.target.value.split('\n').filter(d => d.trim());
                        setSchedulingSettings(prev => ({ ...prev, holidayDates: dates }));
                      }}
                      placeholder="2024-12-25&#10;2025-01-01"
                      rows={4}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-slate-100 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Dates when no meetings should be scheduled (YYYY-MM-DD format)
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedulingSettings}
                    disabled={savingSettings}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

