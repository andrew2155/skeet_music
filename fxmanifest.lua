fx_version 'cerulean'
game 'gta5'

author 'skeet'
description 'skeet_music - standalone URL streaming + Library/Playlists + CarPlay overlay'
version '1.1.0'

ui_page 'ui/index.html'

files {
  'ui/index.html',
  'ui/style.css',
  'ui/app.js',
  'ui/assets/*.png'
}

shared_script 'config.lua'

client_script 'client/main.lua'
server_scripts {
  '@oxmysql/lib/MySQL.lua',
  'server/main.lua'
}

dependencies {
  'qb-core',
  'oxmysql'
}
