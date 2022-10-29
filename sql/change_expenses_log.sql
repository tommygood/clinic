create table change_expenses_log(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`fId` int(11),
`aId` int(11),
`original_money` int(11),
`changed_money` int(11),
`reason` varchar(50)
)
