resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow PostgreSQL access from within the VPC only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from VPC CIDR"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-rds-sg"
  }
}

# RDS subnet group uses private DB subnets — no internet route at the network layer.
# Two AZs satisfy the AWS subnet group minimum; single-AZ is enforced on the instance.
resource "aws_db_subnet_group" "main" {
  name        = "${local.name_prefix}-db-subnet-group"
  subnet_ids  = aws_subnet.private_db[*].id
  description = "Subnet group for ${local.name_prefix} RDS instance (private DB subnets)"

  tags = {
    Name = "${local.name_prefix}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp2"
  storage_encrypted = true

  db_name  = "aspenxdb"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false # Never expose RDS directly to the internet
  multi_az            = false # Single-AZ: prototype/dev only

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  auto_minor_version_upgrade = true

  # Prototype settings: allow terraform destroy without manual intervention.
  deletion_protection = false
  skip_final_snapshot = true

  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}
