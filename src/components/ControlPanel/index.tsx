import React from 'react';
import { useTyphoonStore } from '../../store/typhoonStore';
import { useUIStore } from '../../store/uiStore';
import { PREDEFINED_REGIONS } from '../../data/regions';

const PARAM_INFO: Record<string, { title: string; desc: string; effect: string }> = {
  subtropicalHighStrength: {
    title: '副高强度',
    desc: '副热带高压是西北太平洋台风移动的主要引导气流。强度越大，台风路径越稳定、移动速度越快。',
    effect: '当前值 × 5 ≈ 对台风施加的引导力 (km/h)',
  },
  subtropicalHighDirection: {
    title: '副高方向',
    desc: '副高外围的东南侧气流引导台风向西北移动。270°=偏西, 315°=西北, 0°=偏北。台风通常沿副高边缘呈抛物线路径。',
    effect: '影响台风转向点的位置',
  },
  seaSurfaceTemp: {
    title: '海面温度',
    desc: '台风需要 >26.5°C 的暖海面才能维持强度。海面温度越高，水汽蒸发越强，台风能量越充足。自动模式下随纬度变化：赤道29°C ~ 45°N 22°C。',
    effect: '低于26.5°C开始衰减，低于24°C快速消散',
  },
  landTemperature: {
    title: '陆地温度',
    desc: '台风登陆后受陆地温度影响。温度越高大气越不稳定，衰减越慢。自动模式下随纬度变化：赤道31°C ~ 45°N 22°C。',
    effect: '高温减缓衰减，低温加速消散',
  },
  frictionCoefficient: {
    title: '摩擦系数',
    desc: '模拟地面对台风的摩擦衰减。自动模式下：海上=0.1, 陆地=0.7。系数越大，登陆后风速衰减越快。',
    effect: '海上摩擦≈0.1-0.2, 陆地上≈0.5-0.8',
  },
  verticalWindShear: {
    title: '垂直风切变',
    desc: '不同高度风向风速差异。风切变越大，越容易破坏台风暖心和眼墙结构。',
    effect: '<10m/s 有利增强，>20m/s 明显抑制',
  },
  oceanHeatContent: {
    title: '海洋热含量',
    desc: '暖水层越深，台风越不容易被自身冷尾流削弱，越可能快速增强。',
    effect: '高热含量提高最大潜势强度',
  },
  midLevelHumidity: {
    title: '中层湿度',
    desc: '中层空气越湿，越有利于深对流维持；干空气卷入会削弱台风。',
    effect: '<55% 会抑制增强并促进衰减',
  },
  stormSize: {
    title: '台风尺度',
    desc: '大尺度台风风圈更宽、惯性更强；小尺度台风更紧凑。',
    effect: '影响最大风半径和各级风圈范围',
  },
};

type AutoKey = 'seaSurfaceTemp' | 'landTemperature' | 'frictionCoefficient' | 'subtropicalHighStrength' | 'subtropicalHighDirection' | 'verticalWindShear' | 'oceanHeatContent' | 'midLevelHumidity' | 'stormSize';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

const TOGGLE_IDS: Record<string, string> = {
  '风圈': 'ctrl-toggle-windcircle',
  '路径预测': 'ctrl-toggle-prediction',
  '集合预报': 'ctrl-toggle-ensemble',
  '登陆点': 'ctrl-toggle-landfall',
  '历史路径': 'ctrl-toggle-path',
  '海岸线': 'ctrl-toggle-coastline',
};

export function ControlPanel() {
  const updateEngineConfig = useTyphoonStore((s) => s.updateEngineConfig);
  const engineConfig = useTyphoonStore((s) => s.engineConfig);
  const autoOverrides = useTyphoonStore((s) => s.autoOverrides);
  const toggleAutoOverride = useTyphoonStore((s) => s.toggleAutoOverride);
  const season = useTyphoonStore((s) => s.season);
  const setSeason = useTyphoonStore((s) => s.setSeason);
  const spawnRandom = useTyphoonStore((s) => s.spawnRandom);
  const start = useTyphoonStore((s) => s.start);
  const autoSpawn = useTyphoonStore((s) => s.autoSpawn);
  const toggleAutoSpawn = useTyphoonStore((s) => s.toggleAutoSpawn);

  const showWindCircles = useUIStore((s) => s.showWindCircles);
  const showPath = useUIStore((s) => s.showPath);
  const showPrediction = useUIStore((s) => s.showPrediction);
  const showEnsemblePath = useUIStore((s) => s.showEnsemblePath);
  const showLandfall = useUIStore((s) => s.showLandfall);
  const showCoastline = useUIStore((s) => s.showCoastline);
  const toggleWindCircles = useUIStore((s) => s.toggleWindCircles);
  const toggleRegionMonitor = useUIStore((s) => s.toggleRegionMonitor);
  const monitoredRegions = useUIStore((s) => s.monitoredRegions);
  const togglePath = useUIStore((s) => s.togglePath);
  const togglePrediction = useUIStore((s) => s.togglePrediction);
  const toggleEnsemblePath = useUIStore((s) => s.toggleEnsemblePath);
  const toggleLandfall = useUIStore((s) => s.toggleLandfall);
  const toggleCoastline = useUIStore((s) => s.toggleCoastline);

  const [open, setOpen] = React.useState(false);

  const sliders: { key: string; label: string; value: number; min: number; max: number; step: number; suffix?: string; autoKey: AutoKey }[] = [
    { key: 'subtropicalHighStrength', label: '副高强度', value: engineConfig.subtropicalHighStrength, min: 0, max: 20, step: 0.5, autoKey: 'subtropicalHighStrength' },
    { key: 'subtropicalHighDirection', label: '副高方向', value: engineConfig.subtropicalHighDirection, min: 0, max: 360, step: 5, autoKey: 'subtropicalHighDirection' },
    { key: 'seaSurfaceTemp', label: '海面温度', value: engineConfig.seaSurfaceTemp, min: 20, max: 32, step: 0.5, suffix: '°C', autoKey: 'seaSurfaceTemp' },
    { key: 'landTemperature', label: '陆地温度', value: engineConfig.landTemperature, min: 18, max: 34, step: 0.5, suffix: '°C', autoKey: 'landTemperature' },
    { key: 'frictionCoefficient', label: '摩擦系数', value: engineConfig.frictionCoefficient, min: 0, max: 1, step: 0.05, autoKey: 'frictionCoefficient' },
  ];

  const advancedSliders: { key: string; label: string; value: number; min: number; max: number; step: number; suffix?: string; autoKey: AutoKey }[] = [
    { key: 'verticalWindShear', label: '风切变', value: engineConfig.verticalWindShear, min: 0, max: 40, step: 1, suffix: 'm/s', autoKey: 'verticalWindShear' },
    { key: 'oceanHeatContent', label: '热含量', value: engineConfig.oceanHeatContent, min: 0, max: 1, step: 0.05, autoKey: 'oceanHeatContent' },
    { key: 'midLevelHumidity', label: '湿度', value: engineConfig.midLevelHumidity, min: 30, max: 95, step: 1, suffix: '%', autoKey: 'midLevelHumidity' },
    { key: 'stormSize', label: '尺度', value: engineConfig.stormSize, min: 0, max: 1, step: 0.05, autoKey: 'stormSize' },
  ];

  return (
    <div className="absolute top-16 right-3 md:right-4 z-[803]">
      <button id="ctrl-toggle-btn"
        onClick={() => setOpen(!open)}
        className="glass-button rounded-xl px-3.5 py-2 text-sm font-semibold cursor-pointer shadow-lg shadow-black/20"
      >
        {open ? '关闭' : '控制台'}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 panel p-4 w-[calc(100vw-24px)] max-w-[340px] md:w-[320px] font-mono space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="panel-title font-sans">Environment</h3>
              <span className="text-[10px] text-gray-500">A 自动 / M 手动</span>
            </div>
            <div className="space-y-2.5">
              {sliders.map(({ key, label, value, min, max, step, suffix, autoKey }) => (
                <SliderRow key={key} id={`ctrl-slider-${key}`} label={label} value={value} min={min} max={max} step={step} suffix={suffix}
                  autoOn={autoOverrides[autoKey]} info={PARAM_INFO[key]}
                  onChange={(v) => { if (autoOverrides[autoKey]) toggleAutoOverride(autoKey); updateEngineConfig({ [key]: v } as any); }}
                  onToggleAuto={() => toggleAutoOverride(autoKey)} />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="panel-title font-sans">Intensity Factors</h3>
              <span className="text-[10px] text-gray-500">高级情景</span>
            </div>
            <div className="space-y-2.5">
              {advancedSliders.map(({ key, label, value, min, max, step, suffix, autoKey }) => (
                <SliderRow key={key} id={`ctrl-slider-${key}`} label={label} value={value} min={min} max={max} step={step} suffix={suffix}
                  autoOn={autoOverrides[autoKey]} info={PARAM_INFO[key]}
                  onChange={(v) => { if (autoOverrides[autoKey]) toggleAutoOverride(autoKey); updateEngineConfig({ [key]: v } as any); }}
                  onToggleAuto={() => toggleAutoOverride(autoKey)} />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <h3 className="panel-title mb-2 font-sans">Extreme Mode</h3>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              engineConfig.extremeMode
                ? 'border-red-400/40 bg-red-950/25'
                : 'border-gray-700/30 bg-dark-bg/30 hover:border-cyan-300/30'
            }`}>
              <input
                id="ctrl-extreme-mode"
                type="checkbox"
                checked={engineConfig.extremeMode}
                onChange={(e) => updateEngineConfig({ extremeMode: e.target.checked })}
                className="mt-1 h-4 w-4 accent-typhoon-lv12"
              />
              <span>
                <span className="block text-xs font-bold text-gray-200">19级风暴模拟</span>
                <span className="mt-1 block text-[10px] leading-relaxed text-gray-500">
                  开启后提高最大潜势强度，用于极端情景演示，非默认现实预报模式。
                </span>
              </span>
            </label>
            <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              autoSpawn
                ? 'border-cyan-400/30 bg-cyan-950/20'
                : 'border-gray-700/30 bg-dark-bg/30 hover:border-cyan-300/30'
            }`}>
              <input
                type="checkbox"
                checked={autoSpawn}
                onChange={toggleAutoSpawn}
                className="h-4 w-4 accent-typhoon-lv7 rounded"
              />
              <span>
                <span className="block text-xs font-bold text-gray-200">自动生成</span>
                <span className="mt-0.5 block text-[10px] text-gray-500">台风结束后自动生成新台风</span>
              </span>
            </label>
            <button
              onClick={() => { spawnRandom(); start(); setOpen(false); }}
              className="mt-3 w-full rounded-xl border border-gray-700/30 bg-dark-bg/40 px-3 py-2 text-xs font-semibold text-typhoon-lv7 transition-colors hover:border-cyan-300/40"
            >
              🎲 随机生成台风
            </button>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <h3 className="panel-title mb-2 font-sans">Physics</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <PhysicsToggle label="环流突变" enabled={engineConfig.regimeShiftEnabled} onToggle={(v) => updateEngineConfig({ regimeShiftEnabled: v } as any)} desc="副高/西风槽突然变化" />
              <PhysicsToggle label="藤原效应" enabled={engineConfig.fujiwharaEnabled} onToggle={(v) => updateEngineConfig({ fujiwharaEnabled: v } as any)} desc="虚拟涡旋相互作用" />
              <PhysicsToggle label="地形阻拦" enabled={engineConfig.terrainBlockingEnabled} onToggle={(v) => updateEngineConfig({ terrainBlockingEnabled: v } as any)} desc="山脉阻挡与结构重塑" />
              <PhysicsToggle label="冷尾流" enabled={engineConfig.coldWakeEnabled} onToggle={(v) => updateEngineConfig({ coldWakeEnabled: v } as any)} desc="海温下降抑制强度" />
              <PhysicsToggle label="眼墙置换" enabled={engineConfig.structureChangeEnabled} onToggle={(v) => updateEngineConfig({ structureChangeEnabled: v } as any)} desc="EWRC 与移速突变" />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <h3 className="panel-title mb-2 font-sans">Alert Regions</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PREDEFINED_REGIONS.map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-700/30 bg-dark-bg/30 px-2 py-1.5 text-[10px] text-gray-300 transition-colors hover:border-cyan-300/30">
                  <input
                    type="checkbox"
                    checked={monitoredRegions.includes(r.id)}
                    onChange={() => toggleRegionMonitor(r.id)}
                    className="w-3 h-3 accent-typhoon-lv7 rounded"
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <h3 className="panel-title mb-2 font-sans">Season</h3>
            <div className="segmented">
              {SEASONS.map((s) => (
                <button key={s} id={`ctrl-season-${s}`} onClick={() => setSeason(s)}
                  className={season === s ? 'active' : ''}>
                  {{ spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700/30">
            <h3 className="panel-title mb-2 font-sans">Layers</h3>
            <div className="grid grid-cols-2 gap-2">
              <Toggle id={TOGGLE_IDS['风圈']} label="风圈" checked={showWindCircles} onChange={toggleWindCircles} />
              <Toggle id={TOGGLE_IDS['路径预测']} label="路径预测" checked={showPrediction} onChange={togglePrediction} />
              <Toggle id={TOGGLE_IDS['集合预报']} label="集合预报" checked={showEnsemblePath} onChange={toggleEnsemblePath} />
              <Toggle id={TOGGLE_IDS['登陆点']} label="登陆点" checked={showLandfall} onChange={toggleLandfall} />
              <Toggle id={TOGGLE_IDS['历史路径']} label="历史路径" checked={showPath} onChange={togglePath} />
              <Toggle id={TOGGLE_IDS['海岸线']} label="海岸线" checked={showCoastline} onChange={toggleCoastline} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoIcon({ info }: { info: { title: string; desc: string; effect: string } }) {
  return (
    <span className="group relative inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 text-gray-400 text-[10px] cursor-help ml-1 hover:border-typhoon-lv7 hover:text-typhoon-lv7 transition-colors leading-none shrink-0">
      !
      <div className="absolute top-full right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 mt-2 w-72 p-3 bg-dark-bg border border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[805]">
        <div className="text-typhoon-lv7 text-xs font-bold mb-1">{info.title}</div>
        <div className="text-gray-300 text-[10px] leading-relaxed mb-1">{info.desc}</div>
        <div className="text-gray-500 text-[9px] italic">{info.effect}</div>
      </div>
    </span>
  );
}

function SliderRow({ id, label, value, min, max, step, suffix = '', autoOn, info, onChange, onToggleAuto }: {
  id: string; label: string; value: number; min: number; max: number; step: number; suffix?: string;
  autoOn: boolean; info: { title: string; desc: string; effect: string };
  onChange: (v: number) => void; onToggleAuto: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-auto min-w-[58px] shrink-0 flex items-center">
        {label}<InfoIcon info={info} />
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-typhoon-lv7 min-w-0 rounded-full" />
      <span className="text-gray-200 text-xs w-12 text-right shrink-0 font-mono">
        {step >= 1 ? value.toFixed(0) : value.toFixed(step >= 0.5 ? 1 : 2)}{suffix}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onToggleAuto(); }}
        className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border transition-colors shrink-0 ${
          autoOn ? 'bg-green-900/25 text-green-400 border-green-700/35' : 'bg-yellow-900/25 text-yellow-400 border-yellow-700/35'
        }`}>
        {autoOn ? 'A' : 'M'}
      </button>
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-700/30 bg-dark-bg/30 px-2.5 py-2 text-xs text-gray-300 transition-colors hover:border-cyan-300/30">
      <input id={id} type="checkbox" checked={checked} onChange={onChange}
        className="w-3.5 h-3.5 accent-typhoon-lv7 rounded" />
      <span>{label}</span>
    </label>
  );
}

function PhysicsToggle({ label, enabled, onToggle, desc }: { label: string; enabled: boolean; onToggle: (v: boolean) => void; desc: string }) {
  return (
    <label className={`flex items-start gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
      enabled ? 'border-cyan-500/25 bg-cyan-950/15' : 'border-gray-700/30 bg-dark-bg/30 hover:border-cyan-300/30'
    }`}>
      <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 w-3 h-3 accent-typhoon-lv7 rounded shrink-0" />
      <span className="min-w-0">
        <span className="block text-[10px] font-bold text-gray-200 leading-tight">{label}</span>
        <span className="block text-[9px] text-gray-500 leading-tight mt-0.5">{desc}</span>
      </span>
    </label>
  );
}
