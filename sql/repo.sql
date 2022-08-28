create table repo(
`reId` INT PRIMARY KEY AUTO_INCREMENT,
`code` varchar(5),
`name` varchar(40),
`use` int(8),
`stock` float(5),
`buy` float(5),
`adjust` float(5),
`ex_time` datetime(),
`nId` int(11),
`time` datetime()
)
