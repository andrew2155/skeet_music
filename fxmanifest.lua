fx_version 'cerulean'
game 'gta5'

author 'Grok Assisted'
description 'Standalone Music App for skeet_phone - URL Streaming with Playlists and CarPlay'
version '1.0.0'

ui_page 'ui/index.html'  -- Now in ui/

files {
    'ui/index.html',
    'ui/app.js',
    'ui/style.css',
    'ui/assets/*.png'
}

client_script 'client/main.lua'

dependency 'skeet_phone'