# 🌀 Typhoon Simulation & Warning System

An interactive typhoon simulation and early warning visualization system built with React, TypeScript, and Leaflet.

## Features

### 🌪️ Typhoon Simulation
- **Physics Engine**: 5 physical mechanisms — regime shift, Fujiwhara effect, terrain blocking, cold wake, eyewall replacement
- **MPI-based Intensity**: Maximum Potential Intensity formula calculates realistic upper bounds
- **Rapid Intensification**: Environmental conditions can trigger 3-7x faster intensification
- **Dynamic Steering**: Multi-level steering flow with stochastic perturbations
- **Smart Auto-Spawn**: Environmentally-conditioned typhoon generation, with continuous auto-simulation mode

### 🗺️ Offline Vector Map
- **Fully Offline**: Built on Leaflet with GSHHG coastline data — no API keys or online tile services required
- **GSHHG Coastlines**: High-precision Global Self-consistent Hierarchical High-resolution Shorelines
- **Graticule Layer**: Latitude/longitude grid with tropics and equator lines
- **Online Option**: Optional CartoDB dark tiles for enhanced visuals (free, no API key)

### 📊 Real-time Monitoring
- **Typhoon Monitor Dashboard**: Current intensity, wind circles, pressure, position, movement
- **Active Factors Display**: Real-time explanation of what's affecting the typhoon and why
- **Landfall Tracking**: Automatic landfall detection with map markers and dashboard alerts

### 🌤️ Real Weather Mode
- **Live Data from Open-Meteo**: Fetches real SST, wind shear, humidity, and pressure for current location
- **Auto-refresh**: Updates every 10 minutes or when typhoon moves >1°
- **No API Key Required**: Free and open API

### ⚠️ Regional Alert System
- **Customizable Alert Regions**: Monitor predefined regions (East China coast, Taiwan, Philippines, etc.)
- **Color-coded Alerts**: Blue (notice), Yellow (watch), Orange (warning), Red (emergency)
- **Toast Notifications**: Audio beep + flashing visual alerts when typhoon approaches monitored regions

### 📜 Historical Data
- **Built-in Examples**: Haiyan (2013), Mangkhut (2018), Lekima (2019), Yagi (2024)
- **Replay Timeline**: Full timeline with auto-playback
- **Import Support**: CSV and JSON import for custom typhoon data

### 🎮 Controls
- **Environmental Parameters**: SST, wind shear, humidity, OHC, friction, subtropical high
- **Layer Toggles**: Wind circles, path prediction, ensemble forecast, coastline, landfall markers
- **Extreme Mode**: 19-level storm simulation for extreme scenario demonstration
- **Auto Mode**: Environmental parameters auto-adjust based on latitude and season

## Tech Stack

- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Map Engine**: Leaflet
- **WebGL Rendering**: Custom eye effect overlay
- **Coastline Data**: GSHHG (Global Self-consistent Hierarchical High-resolution Shorelines)
- **Weather API**: Open-Meteo (free, no API key)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Quick Usage Guide

1. Open the control panel (top-right `控制台` button)
2. Adjust environmental parameters or enable `🌤 真实天气模式` for live data
3. The simulation starts automatically with a random typhoon
4. Click on the map to spawn a typhoon at a specific location
5. Enable `自动生成` for continuous simulation
6. Monitor the Dashboard for real-time status and active factors
7. Set up Alert Regions to get notified when typhoons approach

## Controls Reference

| Section | Feature | Description |
|---------|---------|-------------|
| **Environment** | SST, Shear, etc. | Auto/manual environment parameters |
| **Intensity Factors** | Advanced | Shear, OHC, humidity, storm size |
| **Extreme Mode** | 19-level storm | Maximum potential intensity boost |
| **Physics** | 5 mechanisms | Regime shift, Fujiwhara, terrain, cold wake, EWRC |
| **Layers** | Visualization toggles | Wind circles, path, ensemble, coastline |
| **Alert Regions** | Regional monitoring | Select areas to watch |
| **Season** | Spring/Summer/Autumn/Winter | Seasonal environment presets |

## Data Sources

- **Coastline**: GSHHG (NOAA)
- **Weather (optional)**: Open-Meteo API
- **Map tiles (optional)**: CartoDB dark matter (free)

## License

MIT
