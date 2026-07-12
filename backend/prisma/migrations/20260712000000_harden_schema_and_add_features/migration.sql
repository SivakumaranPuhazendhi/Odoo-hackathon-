-- Alter table MaintenanceLog to add resolved field
ALTER TABLE "MaintenanceLog" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false;

-- Part A: Enforce enums at the DB level and add constraints
alter table "Vehicle" add constraint vehicle_status_check
  check (status in ('Available','On Trip','In Shop','Retired'));

alter table "Driver" add constraint driver_status_check
  check (status in ('Available','On Trip','Off Duty','Suspended'));

alter table "Trip" add constraint trip_status_check
  check (status in ('Draft','Dispatched','Completed','Cancelled'));

alter table "Trip" add constraint cargo_weight_positive check ("cargoWeightKg" >= 0);
alter table "Vehicle" add constraint capacity_positive check ("maxCapacityKg" > 0);

-- Part B: Push Critical Invariants into the Database
create or replace function dispatch_trip_atomic(
  p_trip_id int, p_vehicle_id int, p_driver_id int, p_risk_score float
) returns void as $$
begin
  if (select status from "Vehicle" where id = p_vehicle_id) != 'Available' then
    raise exception 'Vehicle is not available';
  end if;
  if (select status from "Driver" where id = p_driver_id) not in ('Available') then
    raise exception 'Driver is not available';
  end if;

  update "Vehicle" set status = 'On Trip' where id = p_vehicle_id;
  update "Driver" set status = 'On Trip' where id = p_driver_id;
  update "Trip" set status = 'Dispatched', "startDate" = now(), "riskScore" = p_risk_score
    where id = p_trip_id;
end;
$$ language plpgsql;

create or replace function auto_lock_vehicle_on_maintenance()
returns trigger as $$
begin
  if new.resolved = false then
    update "Vehicle" set status = 'In Shop' where id = new."vehicleId";
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_lock_vehicle
  after insert on "MaintenanceLog"
  for each row execute function auto_lock_vehicle_on_maintenance();

create or replace function auto_unlock_vehicle_on_resolve()
returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    update "Vehicle" set status = 'Available' where id = new."vehicleId";
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_unlock_vehicle
  after update on "MaintenanceLog"
  for each row execute function auto_unlock_vehicle_on_resolve();

-- Part C: Indexes and Views
create index idx_vehicle_status on "Vehicle"(status);
create index idx_driver_status on "Driver"(status);
create index idx_trip_status on "Trip"(status);
create index idx_trip_vehicle on "Trip"("vehicleId");
create index idx_trip_driver on "Trip"("driverId");
create index idx_fuel_vehicle_date on "FuelExpenseLog"("vehicleId", "date" desc);
create index idx_driver_license_expiry on "Driver"("licenseExpiry");

create or replace view fleet_utilization as
select
  count(*) filter (where status = 'On Trip')::float / nullif(count(*), 0) * 100 as utilization_pct,
  count(*) filter (where status = 'Available') as available_count,
  count(*) filter (where status = 'In Shop') as in_shop_count
from "Vehicle";

create or replace view vehicle_cost_summary as
select
  v.id as "vehicleId", v."licensePlate",
  coalesce(sum(f.cost), 0) as total_fuel_cost,
  coalesce(sum(e.cost), 0) as total_expenses,
  coalesce(sum(f.cost), 0) + coalesce(sum(e.cost), 0) as totalCost,
  (select count(*) from "Trip" t where t."vehicleId" = v.id and t.status = 'Completed') as tripsCount
from "Vehicle" v
left join "FuelExpenseLog" f on f."vehicleId" = v.id
left join "MaintenanceLog" e on e."vehicleId" = v.id
group by v.id, v."licensePlate";

create or replace view licenses_expiring_soon as
select d.id, u.name as full_name, d."licenseNumber", d."licenseExpiry"
from "Driver" d
join "User" u on u.id = d."userId"
where d."licenseExpiry" <= now() + interval '30 days'
order by d."licenseExpiry" asc;

-- Part E: Security (RLS)
alter table "Vehicle" enable row level security;
alter table "Driver" enable row level security;
alter table "Trip" enable row level security;

create policy "Public read access" on "Vehicle" for select using (true);
create policy "Public read access" on "Driver" for select using (true);
create policy "Public read access" on "Trip" for select using (true);
