create table medicines_normal(
`index` INT PRIMARY KEY AUTO_INCREMENT,
`mId` int (11),
`new_mark` varchar(2),
`oral_tablet` varchar(10),
`single_two` varchar(2),
`code` varchar(10),
`price` decimal(9,2),
`price_date` varchar(7),
`price_fin_date` varchar(7),
`medi_eng` varchar(120),
`medi_amount` decimal(7,2),
`medi_unit` varchar(52),
`ingre` varchar(56),
`ingre_amount` decimal(12,3),
`ingre_unit` varchar(51),
`dose_form` varchar(86),
`medi_producer` varchar(20),
`medi_sort` varchar(1),
`quality_code` varchar(1),
`medi_mand` varchar(128),
`sort_group` varchar(300),
`fir_ingre` varchar(56),
`fir_medi_amount` decimal(11,3),
`fir_medi_unit` varchar(51),
`sec_ingre` varchar(56),
`sec_medi_amount` decimal(11,3),
`sec_medi_unit` varchar(51),
`thi_ingre` varchar(56),
`thi_medi_amount` decimal(11,3),
`thi_medi_unit` varchar(51),
`four_ingre` varchar(56),
`four_medi_amount` decimal(11,3),
`four_medi_unit` varchar(51),
`fift_ingre` varchar(56),
`fift_medi_amount` decimal(11,3),
`fift_medi_unit` varchar(51),
`producer` varchar(42),
`atc_code` varchar(8),
`no_input` varchar(1)
)


