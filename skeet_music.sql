CREATE TABLE IF NOT EXISTS skeet_music_tracks (
  id INT NOT NULL AUTO_INCREMENT,
  citizenid VARCHAR(64) NOT NULL,
  title VARCHAR(80) NOT NULL,
  url VARCHAR(512) NOT NULL,
  artist VARCHAR(80) DEFAULT NULL,
  artwork_url VARCHAR(512) DEFAULT NULL,
  is_radio TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_citizenid (citizenid)
);

CREATE TABLE IF NOT EXISTS skeet_music_playlists (
  id INT NOT NULL AUTO_INCREMENT,
  citizenid VARCHAR(64) NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_citizenid (citizenid)
);

CREATE TABLE IF NOT EXISTS skeet_music_playlist_items (
  playlist_id INT NOT NULL,
  track_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, track_id),
  KEY idx_playlist (playlist_id),
  KEY idx_track (track_id)
);

CREATE TABLE IF NOT EXISTS skeet_music_settings (
  citizenid VARCHAR(64) NOT NULL,
  volume FLOAT NOT NULL DEFAULT 0.65,
  shuffle TINYINT(1) NOT NULL DEFAULT 0,
  repeat_mode VARCHAR(10) NOT NULL DEFAULT 'off',  -- off|one|all
  last_track_id INT DEFAULT NULL,
  last_url VARCHAR(512) DEFAULT NULL,
  last_title VARCHAR(80) DEFAULT NULL,
  last_artist VARCHAR(80) DEFAULT NULL,
  last_artwork_url VARCHAR(512) DEFAULT NULL,
  last_position FLOAT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (citizenid)
);
