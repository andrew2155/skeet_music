local QBCore = exports['qb-core']:GetCoreObject()

local function citizenId(src)
  local p = QBCore.Functions.GetPlayer(src)
  return p and p.PlayerData and p.PlayerData.citizenid or nil
end

local function ensureSettings(cid)
  local row = MySQL.single.await('SELECT * FROM skeet_music_settings WHERE citizenid = ?', { cid })
  if row then return row end
  MySQL.insert.await(
    'INSERT INTO skeet_music_settings (citizenid, volume, shuffle, repeat_mode) VALUES (?, ?, 0, "off")',
    { cid, Config.DefaultVolume or 0.65 }
  )
  return MySQL.single.await('SELECT * FROM skeet_music_settings WHERE citizenid = ?', { cid })
end

QBCore.Functions.CreateCallback('skeet_music:getData', function(src, cb)
  local cid = citizenId(src)
  if not cid then return cb(nil) end

  local settings = ensureSettings(cid)
  local tracks = MySQL.query.await('SELECT * FROM skeet_music_tracks WHERE citizenid = ? ORDER BY created_at DESC', { cid })
  local playlists = MySQL.query.await('SELECT * FROM skeet_music_playlists WHERE citizenid = ? ORDER BY created_at DESC', { cid })
  local items = MySQL.query.await([[
    SELECT i.playlist_id, i.track_id, i.sort_order
    FROM skeet_music_playlist_items i
    JOIN skeet_music_playlists p ON p.id = i.playlist_id
    WHERE p.citizenid = ?
    ORDER BY i.sort_order ASC
  ]], { cid })

  cb({
    settings = settings,
    tracks = tracks,
    playlists = playlists,
    playlistItems = items
  })
end)

RegisterNetEvent('skeet_music:setSettings', function(partial)
  local src = source
  local cid = citizenId(src)
  if not cid or type(partial) ~= 'table' then return end
  ensureSettings(cid)

  MySQL.update.await([[
    UPDATE skeet_music_settings
    SET volume = COALESCE(?, volume),
        shuffle = COALESCE(?, shuffle),
        repeat_mode = COALESCE(?, repeat_mode)
    WHERE citizenid = ?
  ]], { partial.volume, partial.shuffle, partial.repeat_mode, cid })
end)

RegisterNetEvent('skeet_music:saveLast', function(last)
  local src = source
  local cid = citizenId(src)
  if not cid or type(last) ~= 'table' then return end
  ensureSettings(cid)

  MySQL.update.await([[
    UPDATE skeet_music_settings
    SET last_track_id = ?,
        last_url = ?,
        last_title = ?,
        last_artist = ?,
        last_artwork_url = ?,
        last_position = ?
    WHERE citizenid = ?
  ]], {
    last.track_id,
    last.url,
    last.title,
    last.artist,
    last.artwork_url,
    last.position or 0,
    cid
  })
end)

QBCore.Functions.CreateCallback('skeet_music:saveTrack', function(src, cb, payload)
  local cid = citizenId(src)
  if not cid or type(payload) ~= 'table' then return cb(false) end

  local title = tostring(payload.title or ''):sub(1, 80)
  local url = tostring(payload.url or ''):sub(1, Config.MaxUrlLength or 512)
  if title == '' or url == '' then return cb(false) end

  local okScheme = false
  for _, s in ipairs(Config.AllowedSchemes or { 'https://' }) do
    if url:sub(1, #s) == s then okScheme = true break end
  end
  if not okScheme then return cb(false) end

  local id = MySQL.insert.await([[
    INSERT INTO skeet_music_tracks (citizenid, title, url, artist, artwork_url, is_radio)
    VALUES (?, ?, ?, ?, ?, ?)
  ]], {
    cid,
    title,
    url,
    payload.artist and tostring(payload.artist):sub(1,80) or nil,
    payload.artwork_url and tostring(payload.artwork_url):sub(1,512) or nil,
    payload.is_radio and 1 or 0
  })

  cb(id and id > 0 and id or false)
end)

QBCore.Functions.CreateCallback('skeet_music:deleteTrack', function(src, cb, trackId)
  local cid = citizenId(src)
  trackId = tonumber(trackId)
  if not cid or not trackId then return cb(false) end

  MySQL.update.await([[
    DELETE i FROM skeet_music_playlist_items i
    JOIN skeet_music_tracks t ON t.id = i.track_id
    WHERE i.track_id = ? AND t.citizenid = ?
  ]], { trackId, cid })

  local rows = MySQL.update.await('DELETE FROM skeet_music_tracks WHERE id = ? AND citizenid = ?', { trackId, cid })
  cb(rows and rows > 0)
end)

QBCore.Functions.CreateCallback('skeet_music:createPlaylist', function(src, cb, name)
  local cid = citizenId(src)
  if not cid then return cb(false) end
  name = tostring(name or ''):sub(1, 50)
  if name == '' then return cb(false) end

  local id = MySQL.insert.await('INSERT INTO skeet_music_playlists (citizenid, name) VALUES (?, ?)', { cid, name })
  cb(id and id > 0 and id or false)
end)

QBCore.Functions.CreateCallback('skeet_music:deletePlaylist', function(src, cb, pid)
  local cid = citizenId(src)
  pid = tonumber(pid)
  if not cid or not pid then return cb(false) end

  MySQL.update.await('DELETE FROM skeet_music_playlist_items WHERE playlist_id = ?', { pid })
  local rows = MySQL.update.await('DELETE FROM skeet_music_playlists WHERE id = ? AND citizenid = ?', { pid, cid })
  cb(rows and rows > 0)
end)

QBCore.Functions.CreateCallback('skeet_music:addToPlaylist', function(src, cb, payload)
  local cid = citizenId(src)
  if not cid or type(payload) ~= 'table' then return cb(false) end

  local pid = tonumber(payload.playlist_id)
  local tid = tonumber(payload.track_id)
  if not pid or not tid then return cb(false) end

  local p = MySQL.single.await('SELECT id FROM skeet_music_playlists WHERE id = ? AND citizenid = ?', { pid, cid })
  local t = MySQL.single.await('SELECT id FROM skeet_music_tracks WHERE id = ? AND citizenid = ?', { tid, cid })
  if not p or not t then return cb(false) end

  local maxSort = MySQL.single.await('SELECT COALESCE(MAX(sort_order),0) AS m FROM skeet_music_playlist_items WHERE playlist_id = ?', { pid })
  local nextSort = (maxSort and maxSort.m or 0) + 1

  MySQL.insert.await([[
    INSERT INTO skeet_music_playlist_items (playlist_id, track_id, sort_order)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)
  ]], { pid, tid, nextSort })

  cb(true)
end)

QBCore.Functions.CreateCallback('skeet_music:removeFromPlaylist', function(src, cb, payload)
  local cid = citizenId(src)
  if not cid or type(payload) ~= 'table' then return cb(false) end

  local pid = tonumber(payload.playlist_id)
  local tid = tonumber(payload.track_id)
  if not pid or not tid then return cb(false) end

  local p = MySQL.single.await('SELECT id FROM skeet_music_playlists WHERE id = ? AND citizenid = ?', { pid, cid })
  if not p then return cb(false) end

  local rows = MySQL.update.await('DELETE FROM skeet_music_playlist_items WHERE playlist_id = ? AND track_id = ?', { pid, tid })
  cb(rows and rows > 0)
end)
