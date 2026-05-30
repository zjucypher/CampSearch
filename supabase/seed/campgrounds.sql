-- California campground catalog (seed data)
-- Sources: Recreation.gov facility IDs + manual lat/lng
insert into campgrounds (id, name, park, rec_area_id, agency, lat, lng, site_count, amenities, booking_url) values

-- Yosemite
('upper-pines',     'Upper Pines',          'Yosemite National Park',    232447, 'NPS',  37.7391, -119.5591, 238, '{flush-toilets,potable-water,fire-ring,bear-boxes}',           'https://www.recreation.gov/camping/campgrounds/232447'),
('lower-pines',     'Lower Pines',          'Yosemite National Park',    232450, 'NPS',  37.7376, -119.5567,  60, '{flush-toilets,potable-water,fire-ring,bear-boxes}',           'https://www.recreation.gov/camping/campgrounds/232450'),
('north-pines',     'North Pines',          'Yosemite National Park',    232449, 'NPS',  37.7400, -119.5538,  81, '{flush-toilets,potable-water,fire-ring,bear-boxes}',           'https://www.recreation.gov/camping/campgrounds/232449'),
('half-dome',       'Half Dome Village',    'Yosemite National Park',    234652, 'NPS',  37.7397, -119.5712, 318, '{showers,flush-toilets,potable-water,fire-ring,food-storage}', 'https://www.recreation.gov/camping/campgrounds/234652'),
('tuolumne',        'Tuolumne Meadows',     'Yosemite National Park',    232448, 'NPS',  37.8766, -119.3500, 304, '{flush-toilets,potable-water,fire-ring,bear-boxes}',           'https://www.recreation.gov/camping/campgrounds/232448'),
('bridalveil',      'Bridalveil Creek',     'Yosemite National Park',    232453, 'NPS',  37.6742, -119.6564, 110, '{vault-toilets,potable-water,fire-ring}',                      'https://www.recreation.gov/camping/campgrounds/232453'),

-- Big Sur
('pfeiffer-big-sur','Pfeiffer Big Sur',     'Big Sur State Park',        null,   'CA-SP', 36.2495, -121.7821, 189, '{showers,flush-toilets,potable-water,fire-ring}',              'https://www.reservecalifornia.com/'),
('andrew-molera',   'Andrew Molera Walk-In','Big Sur State Park',        null,   'CA-SP', 36.2802, -121.8472,  24, '{vault-toilets,potable-water,fire-ring}',                      'https://www.reservecalifornia.com/'),
('kirk-creek',      'Kirk Creek',           'Los Padres National Forest', 233116, 'USFS', 35.9842, -121.4810,  33, '{vault-toilets,no-water,fire-ring,ocean-views}',               'https://www.recreation.gov/camping/campgrounds/233116'),

-- Lake Tahoe
('fallen-leaf',     'Fallen Leaf Lake',     'Lake Tahoe Basin MGMT',    232769, 'USFS', 38.8975, -120.0506, 206, '{flush-toilets,potable-water,fire-ring,boat-ramp}',            'https://www.recreation.gov/camping/campgrounds/232769'),
('camp-richardson', 'Camp Richardson',      'Lake Tahoe Basin MGMT',    10105555, 'USFS', 38.9278, -120.0694,  35, '{showers,flush-toilets,potable-water,fire-ring}',              'https://www.recreation.gov/camping/campgrounds/10105555'),
('d-l-bliss',       'D.L. Bliss',          'Lake Tahoe State Park',     null,   'CA-SP', 38.9636, -120.0967, 168, '{showers,flush-toilets,potable-water,fire-ring}',              'https://www.reservecalifornia.com/'),

-- Death Valley
('furnace-creek',   'Furnace Creek',        'Death Valley National Park', 233349, 'NPS',  36.4628, -116.8680, 136, '{flush-toilets,potable-water,fire-ring,dump-station}',         'https://www.recreation.gov/camping/campgrounds/233349'),
('mesquite-spring', 'Mesquite Spring',      'Death Valley National Park', 233350, 'NPS',  36.7530, -117.0242,  30, '{flush-toilets,potable-water,fire-ring}',                      'https://www.recreation.gov/camping/campgrounds/233350'),

-- Point Reyes
('sky-camp',        'Sky Camp',             'Point Reyes National Seashore', 233359, 'NPS', 38.0497, -122.9072, 12, '{vault-toilets,no-water,bear-boxes}',                     'https://www.recreation.gov/camping/campgrounds/233359'),
('coast-camp',      'Coast Camp',           'Point Reyes National Seashore', 233359, 'NPS', 38.0283, -122.9474, 14, '{vault-toilets,no-water,bear-boxes}',                     'https://www.recreation.gov/camping/campgrounds/233359'),

-- Channel Islands
('scorpion-ranch',  'Scorpion Ranch',       'Channel Islands National Park', 233392, 'NPS', 33.9893, -119.5549, 25, '{vault-toilets,no-water,bear-boxes}',                     'https://www.recreation.gov/camping/campgrounds/233392'),

-- Sequoia & Kings Canyon
('lodgepole',       'Lodgepole',            'Sequoia National Park',     232498, 'NPS',  36.5932, -118.7260, 214, '{showers,flush-toilets,potable-water,fire-ring}',              'https://www.recreation.gov/camping/campgrounds/232498'),
('sheep-creek',     'Sheep Creek',          'Kings Canyon National Park', 232499, 'NPS', 36.8002, -118.9691, 111, '{flush-toilets,potable-water,fire-ring}',                      'https://www.recreation.gov/camping/campgrounds/232499'),

-- Joshua Tree
('jumbo-rocks',     'Jumbo Rocks',          'Joshua Tree National Park',  233369, 'NPS',  33.9842, -116.0415, 124, '{vault-toilets,no-water,fire-ring}',                           'https://www.recreation.gov/camping/campgrounds/233369'),
('hidden-valley',   'Hidden Valley',        'Joshua Tree National Park',  233370, 'NPS',  34.0142, -116.1671,  44, '{vault-toilets,no-water,fire-ring}',                           'https://www.recreation.gov/camping/campgrounds/233370')

on conflict (id) do nothing;
