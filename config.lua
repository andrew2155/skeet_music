Config = {}

Config.Enable = true

-- App metadata (for phone registration attempts)
Config.App = {
  id = 'music',
  name = 'Music',
  icon = 'ui/assets/icon_music.png'
}

-- URL rules
Config.AllowedSchemes = { 'https://' }
Config.MaxUrlLength = 512

-- Default settings
Config.DefaultVolume = 0.65

-- CarPlay
Config.CarPlay = {
  Enable = true,

  -- Driver only (your choice)
  DriverOnly = true,

  -- ===== Overlay (Top-left panel) =====
  -- This is the ONLY way to get CarPlay to appear top-left without editing skeet_phone.
  OverlayEnable = true,

  -- Toggle key for overlay (recommend F7 so it doesn’t fight the phone)
  OverlayKey = 'F7',

  -- Auto-open overlay when driver enters a vehicle AND music is playing
  AutoOpenWhenPlaying = true,

  -- Where it sits on screen (px)
  X = 24,
  Y = 24,

  -- Size (px) - similar vibe to your reference screenshot
  W = 820,
  H = 415,
}
