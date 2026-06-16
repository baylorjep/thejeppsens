-- Split 'Americas' into 'North America' and 'South America'
UPDATE visited_countries
SET continent = 'South America'
WHERE continent = 'Americas'
  AND geo_name IN (
    'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela',
    'Bolivia', 'Ecuador', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana'
  );

-- Everything else in Americas is North America / Central America / Caribbean
UPDATE visited_countries
SET continent = 'North America'
WHERE continent = 'Americas';
