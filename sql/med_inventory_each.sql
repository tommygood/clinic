create table med_inventory_each (
	`no` INT PRIMARY KEY AUTO_INCREMENT,
	`code` varchar(10),
	`purchase_date` datetime default current_timestamp,
	`expire` varchar(10),
	`aId` int(11),
	`quantity` int(11)
)
	
