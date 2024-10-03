-- Table 'sync_status' --
--  0: sync is not in progress
--  1: sync is in progress
create table sync_status (value int default 0);

insert into
	sync_status(value)
values
	(-1);

-- Table 'repos' --
-- store repos details
create table repos (
	id serial,
	name varchar not null,
	language varchar(20),
	star_count int default 0,
	updated_at varchar(80)
);

comment on table repos is 'IBM''s public repos in GitHub';

create unique index repos_id_uindex on repos (id);

create unique index repos_name_uindex on repos (name);

alter table
	repos
add
	constraint repos_pk primary key (id);