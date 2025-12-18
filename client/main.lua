local QBCore = exports['qb-core']:GetCoreObject()

local overlayOpen = false
local playing = false
exports('RegisterApp', function(appMeta)
  -- stores in Registry.apps
end)

CreateThread(function()
  if not Config.Enable then return end

  local appMeta = {
    id = 'music',
    name = 'Music',
    icon = 'ui/assets/icon_music.png',
    resource = GetCurrentResourceName(),
    ui = 'ui/index.html',
    kind = 'iframe',
    preinstalled = true
  }

  -- retry until skeet_phone export exists (handles ensure order / restarts)
  while true do
    local ok = false

  if exports['skeet_phone'] and exports['skeet_phone'].RegisterApp then
  ok = exports['skeet_phone']:RegisterApp(appMeta) == true
  print('[skeet_music] RegisterApp result:', ok)
else
  print('[skeet_music] RegisterApp export not found yet...')
end

    if ok then break end
    Wait(1000)
  end
end)


-- =========================
-- Register Music App with skeet_phone (ONCE)
-- =========================

local function send(action, data)
  SendNUIMessage({ action = action, data = data })
end

local function openOverlay()
  if not Config.CarPlay.OverlayEnable then return end
  if overlayOpen then return end
  overlayOpen = true

  SetNuiFocus(true, true)
  SetNuiFocusKeepInput(true)

  send('music:show', {
    mode = 'carplay',
    overlay = {
      x = Config.CarPlay.X,
      y = Config.CarPlay.Y,
      w = Config.CarPlay.W,
      h = Config.CarPlay.H,
    }
  })

  QBCore.Functions.TriggerCallback('skeet_music:getData', function(data)
    if data then
      send('music:init', data)
    end
  end)
end

local function closeOverlay()
  if not overlayOpen then return end
  overlayOpen = false

  SetNuiFocus(false, false)
  SetNuiFocusKeepInput(false)

  send('music:hide', {})
end

local function isDriver()
  local ped = PlayerPedId()
  if not IsPedInAnyVehicle(ped, false) then return false end
  local veh = GetVehiclePedIsIn(ped, false)
  return (GetPedInVehicleSeat(veh, -1) == ped)
end

-- Key toggle for overlay
CreateThread(function()
  while true do
    Wait(0)
    if Config.CarPlay.Enable and Config.CarPlay.OverlayEnable then
      if IsControlJustPressed(0, 168) then -- F7 default (Control 168)
        if overlayOpen then closeOverlay() else openOverlay() end
      end
    end
  end
end)

-- Auto-open when driver & playing
CreateThread(function()
  while true do
    Wait(400)

    if not Config.CarPlay.Enable or not Config.CarPlay.OverlayEnable or not Config.CarPlay.AutoOpenWhenPlaying then
      goto continue
    end

    if playing and isDriver() then
      openOverlay()
    else
      -- don’t auto-close; user can keep it open. If you want auto-close, uncomment:
      -- if overlayOpen then closeOverlay() end
    end

    ::continue::
  end
end)

-- ========= NUI callbacks =========
RegisterNUICallback('music:close', function(_, cb)
  closeOverlay()
  cb(true)
end)

RegisterNUICallback('music:getData', function(_, cb)
  QBCore.Functions.TriggerCallback('skeet_music:getData', function(data)
    cb(data or {})
  end)
end)

RegisterNUICallback('music:setSettings', function(payload, cb)
  TriggerServerEvent('skeet_music:setSettings', payload or {})
  cb(true)
end)

RegisterNUICallback('music:saveLast', function(payload, cb)
  TriggerServerEvent('skeet_music:saveLast', payload or {})
  cb(true)
end)

RegisterNUICallback('music:saveTrack', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:saveTrack', function(id)
    cb({ ok = id and true or false, id = id })
  end, payload)
end)

RegisterNUICallback('music:deleteTrack', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:deleteTrack', function(ok)
    cb({ ok = ok })
  end, payload and payload.track_id)
end)

RegisterNUICallback('music:createPlaylist', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:createPlaylist', function(id)
    cb({ ok = id and true or false, id = id })
  end, payload and payload.name)
end)

RegisterNUICallback('music:deletePlaylist', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:deletePlaylist', function(ok)
    cb({ ok = ok })
  end, payload and payload.playlist_id)
end)

RegisterNUICallback('music:addToPlaylist', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:addToPlaylist', function(ok)
    cb({ ok = ok })
  end, payload)
end)

RegisterNUICallback('music:removeFromPlaylist', function(payload, cb)
  QBCore.Functions.TriggerCallback('skeet_music:removeFromPlaylist', function(ok)
    cb({ ok = ok })
  end, payload)
end)

-- Playback flag so auto-open works
RegisterNUICallback('music:setPlaying', function(payload, cb)
  playing = payload and payload.playing == true
  cb(true)
end)
