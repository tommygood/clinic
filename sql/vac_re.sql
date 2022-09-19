create table vac_re(
`vrId` INT PRIMARY KEY AUTO_INCREMENT,
`apply` int(1) default 0,
`time` datetime default current_timestamp,
`pId` int(11),
`vId` int(11)
)
