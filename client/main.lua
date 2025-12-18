local QBCore = exports['qb-core']:GetCoreObject()

-- Register the app with the phone (retry loop for start order)
CreateThread(function()
    local tries = 0
    while tries < 10 do
        if exports['skeet_phone'] then
            local appMeta = {
                id = 'music',
                name = 'Music',
                icon = 'ui/assets/icon_music.png',  -- Updated for ui/
                resource = GetCurrentResourceName(),
                kind = 'iframe',
                preinstalled = true,
                ui = 'ui/index.html'  -- Custom field for patch to use
            }
            local result = exports['skeet_phone']:RegisterApp(appMeta)
            print('[skeet_music] RegisterApp result: ' .. tostring(result))
            break
        end
        tries = tries + 1
        Wait(1000)
    end
    if tries >= 10 then
        print('[skeet_music] Failed to register app - ensure skeet_phone starts first!')
    end
end)

-- CarPlay overlay (separate NUI)
local carPlayActive = false
RegisterCommand('carplay', function()
    if IsPedInAnyVehicle(PlayerPedId(), false) then
        carPlayActive = not carPlayActive
        SetNuiFocus(carPlayActive, carPlayActive)
        SendNUIMessage({ action = 'toggleCarPlay', show = carPlayActive })
    else
        QBCore.Functions.Notify('You must be in a vehicle for CarPlay.', 'error')
    end
end, false)
RegisterKeyMapping('carplay', 'Toggle CarPlay Overlay', 'keyboard', 'F7')

-- NUI callbacks (if needed for future server sync; empty for now)
RegisterNUICallback('close', function(data, cb)
    SetNuiFocus(false, false)
    cb({})
end)