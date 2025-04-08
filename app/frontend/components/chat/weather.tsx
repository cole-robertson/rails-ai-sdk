import { format, isWithinInterval } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
interface WeatherAtLocation {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

function n(num: number): number {
  return Math.ceil(num);
}

export function Weather({
  weatherAtLocation
}: {
  weatherAtLocation?: WeatherAtLocation;
}) {
  const currentHigh = weatherAtLocation 
    ? Math.max(...weatherAtLocation.hourly.temperature_2m.slice(0, 24))
    : null;
  const currentLow = weatherAtLocation 
    ? Math.min(...weatherAtLocation.hourly.temperature_2m.slice(0, 24))
    : null;

  const isDay = weatherAtLocation 
    ? isWithinInterval(new Date(weatherAtLocation.current.time), {
        start: new Date(weatherAtLocation.daily.sunrise[0]),
        end: new Date(weatherAtLocation.daily.sunset[0]),
      }) 
    : true; // Default to day mode when loading

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hoursToShow = isMobile ? 5 : 6;

  // For loading state, create placeholder arrays
  const displayTimes = weatherAtLocation 
    ? weatherAtLocation.hourly.time
        .slice(
          weatherAtLocation.hourly.time.findIndex(
            (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
          ),
          weatherAtLocation.hourly.time.findIndex(
            (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
          ) + hoursToShow
        )
    : Array(hoursToShow).fill('');

  const displayTemperatures = weatherAtLocation 
    ? weatherAtLocation.hourly.temperature_2m
        .slice(
          weatherAtLocation.hourly.time.findIndex(
            (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
          ),
          weatherAtLocation.hourly.time.findIndex(
            (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
          ) + hoursToShow
        )
    : Array(hoursToShow).fill(null);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px]',
        {
          'bg-blue-400': (isDay && weatherAtLocation) || !weatherAtLocation,
        },
        {
          'bg-indigo-900': !isDay && weatherAtLocation,
        }
      )}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <div
            className={cn(
              'size-10 rounded-full skeleton-div',
              {
                'bg-yellow-300': isDay && weatherAtLocation,
              },
              {
                'bg-indigo-100': !isDay && weatherAtLocation,
              }
            )}
          />
          <div className="text-4xl font-medium text-blue-50">
            {weatherAtLocation 
              ? `${n(weatherAtLocation.current.temperature_2m)}${weatherAtLocation.current_units.temperature_2m}`
              : '—°'}
          </div>
        </div>

        <div className="text-blue-50">
          {weatherAtLocation
            ? `H:${n(currentHigh!)}° L:${n(currentLow!)}°`
            : 'H:—° L:—°'}
        </div>
      </div>

      <div className="flex flex-row justify-between">
        {displayTimes.map((time, index) => (
          <div key={time || index} className="flex flex-col items-center gap-1">
            <div className="text-blue-100 text-xs">
              {time ? format(new Date(time), 'ha') : '—'}
            </div>
            <div
              className={cn(
                'size-6 rounded-full skeleton-div',
                {
                  'bg-yellow-300': isDay && weatherAtLocation,
                },
                {
                  'bg-indigo-200': !isDay && weatherAtLocation,
                }
              )}
            />
            <div className="text-blue-50 text-sm">
              {weatherAtLocation && displayTemperatures[index] !== null
                ? `${n(displayTemperatures[index])}${weatherAtLocation.hourly_units.temperature_2m}`
                : '—°'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
