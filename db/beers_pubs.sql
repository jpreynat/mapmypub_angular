CREATE TABLE beers_pubs (
  beer_id int(21),
  pub_id int(21),
  last_mod datetime NOT NULL default '0000-00-00 00:00:00',
  FOREIGN KEY (beer_id) REFERENCES beers(id),
  FOREIGN KEY (pub_id) REFERENCES pubs(id)
) ENGINE=INNODB;