CREATE TABLE `pubs` (
  `id` int(21) NOT NULL auto_increment,
  `name` varchar(255) character set utf8 collate utf8_unicode_ci NOT NULL default '',
  `address` varchar(255) character set utf8 collate utf8_unicode_ci NOT NULL default '',
  `lat` double NOT NULL default '0',
  `lng` double NOT NULL default '0',
  `descript` text character set utf8 collate utf8_unicode_ci NOT NULL default '',
  `add_user` int(11) NOT NULL default '0',
  `last_mod` datetime NOT NULL default '0000-00-00 00:00:00',
  PRIMARY KEY  (`id`)
) ENGINE=INNODB;