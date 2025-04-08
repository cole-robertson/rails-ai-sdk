import { format, isWithinInterval } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
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

// Helper function to check if a time is during day or night
function isDuringDay(time: string, sunrises: string[], sunsets: string[]): boolean {
  const timeDate = new Date(time);
  const timeDay = timeDate.getDate();
  
  // Find the sunrise and sunset for the correct day
  let dayIndex = 0;
  for (let i = 0; i < sunrises.length; i++) {
    const sunriseDay = new Date(sunrises[i]).getDate();
    if (sunriseDay === timeDay) {
      dayIndex = i;
      break;
    }
  }

  return isWithinInterval(timeDate, {
    start: new Date(sunrises[dayIndex]),
    end: new Date(sunsets[dayIndex]),
  });
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

  // Default isDay based on current time
  const defaultIsDay = weatherAtLocation 
    ? isWithinInterval(new Date(weatherAtLocation.current.time), {
        start: new Date(weatherAtLocation.daily.sunrise[0]),
        end: new Date(weatherAtLocation.daily.sunset[0]),
      }) 
    : true;
    
  const [isDay, setIsDay] = useState(defaultIsDay);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show 24 hours of forecast data
  const hoursToDisplay = 24;
  const visibleHoursAtOnce = isMobile ? 5 : 6;

  // Find starting index for the current time
  const startIndex = weatherAtLocation 
    ? weatherAtLocation.hourly.time.findIndex(
        (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
      )
    : 0;

  // For loading state, create placeholder arrays
  const displayTimes = weatherAtLocation 
    ? weatherAtLocation.hourly.time.slice(startIndex, startIndex + hoursToDisplay)
    : Array(visibleHoursAtOnce).fill('');

  const displayTemperatures = weatherAtLocation 
    ? weatherAtLocation.hourly.temperature_2m.slice(startIndex, startIndex + hoursToDisplay)
    : Array(visibleHoursAtOnce).fill(null);

  // Update day/night mode based on scroll position, focusing on center hour
  useEffect(() => {
    if (!weatherAtLocation || !scrollRef.current) return;
    
    const scrollContainer = scrollRef.current;
    
    const updateDayNightMode = () => {
      if (!scrollContainer || !weatherAtLocation) return;
      
      const scrollPosition = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const itemWidth = 44; // Width of each hour item (32px + 12px gap)
      
      // Calculate the center position in the scroll container
      const centerPosition = scrollPosition + (containerWidth / 2);
      
      // Find which hour item is at the center
      const centerItemIndex = Math.floor(centerPosition / itemWidth);
      
      // Make sure the index is valid
      if (centerItemIndex >= 0 && centerItemIndex < displayTimes.length && displayTimes[centerItemIndex]) {
        // Check if the center hour is day or night
        const centerTime = displayTimes[centerItemIndex];
        const centerIsDay = isDuringDay(
          centerTime,
          weatherAtLocation.daily.sunrise,
          weatherAtLocation.daily.sunset
        );
        
        setIsDay(centerIsDay);
      }
    };
    
    // Initial check
    updateDayNightMode();
    
    // Add scroll event listener
    scrollContainer.addEventListener('scroll', updateDayNightMode);
    
    return () => {
      scrollContainer.removeEventListener('scroll', updateDayNightMode);
    };
  }, [weatherAtLocation, displayTimes]);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px] transition-colors duration-700',
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
              'size-10 rounded-full skeleton-div transition-colors duration-700',
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

      <div className="relative" ref={scrollContainerRef}>
        <div 
          className="overflow-x-auto pb-2 no-scrollbar" 
          ref={scrollRef}
        >
          <div className="flex flex-row gap-8" style={{ width: 'max-content', minWidth: '100%' }}>
            {displayTimes.map((time, index) => (
              <div 
                key={time || index} 
                className="flex flex-col items-center gap-1" 
              >
                <div className="text-blue-100 text-xs">
                  {time ? format(new Date(time), 'ha') : '—'}
                </div>
                <div
                  className={cn(
                    'size-6 rounded-full skeleton-div transition-colors duration-700',
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
        {/* Scroll indicators */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full flex items-center">
          <div className={cn(
            "w-6 h-10 bg-gradient-to-l transition-colors duration-700",
            isDay && weatherAtLocation ? "from-blue-400 to-transparent opacity-50" : "from-indigo-900 to-transparent opacity-50"
          )}></div>
        </div>
      </div>
    </div>
  );
}
