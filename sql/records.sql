create table records(
`no` INT PRIMARY KEY AUTO_INCREMENT,
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
`in` int(1),
`real_start` datetime
)
