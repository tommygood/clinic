create table no_records(
`nrId` INT PRIMARY KEY AUTO_INCREMENT,
`r_num` int(11),
`no` int(1) default 1,
`num` int(11),
`start` datetime default current_timestamp,
`end` datetime,
`pId` int(11),
`mark` varchar(50),
`regist` int(3),
`self_part` int(4),
`all_self` int(6),
`deposit` int(4),
`dId` int(11),
`in` int(1)
)
