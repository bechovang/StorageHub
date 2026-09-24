import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  Drawer,
  Footer,
  Header,
  Input,
  Modal,
  Select,
  Textarea,
  UnitCard,
} from "../../components";
import "./DesignSystemPage.css";

const sampleUnits = [
  {
    id: "unit-s1",
    code: "S-1",
    type: "Locker",
    sizeM2: 3,
    zone: "Zone A",
    floor: 1,
    accessType: "PIN access",
    features: ["Indoor", "Ground floor"],
    monthlyPrice: 225000,
    availability: "available",
    availableFrom: "2026-10-05",
    imageVariant: 1,
  },
  {
    id: "unit-m1",
    code: "M-1",
    type: "Indoor",
    sizeM2: 6,
    zone: "Zone B",
    floor: 2,
    accessType: "QR access",
    features: ["Indoor", "Freight lift"],
    monthlyPrice: 430000,
    availability: "soon",
    availableFrom: "2026-10-07",
    bufferNote: "cleaning buffer",
    imageVariant: 4,
  },
];

const columns = [
  {
    key: "code",
    header: "Rental code",
  },
  {
    key: "unit",
    header: "Unit",
  },
  {
    key: "customer",
    header: "Customer",
  },
  {
    key: "status",
    header: "Status",
    render: (status) => (
      <Badge tone={status === "ACTIVE" ? "success" : "warning"}>
        {status}
      </Badge>
    ),
  },
];

const rows = [
  {
    id: 1,
    code: "RT-2026-0041",
    unit: "B-214",
    customer: "Lan Anh",
    status: "ACTIVE",
  },
  {
    id: 2,
    code: "RT-2026-0042",
    unit: "A-108",
    customer: "Minh An",
    status: "ACTIVE",
  },
  {
    id: 3,
    code: "RT-2026-0043",
    unit: "C-302",
    customer: "Quoc Huy",
    status: "PENDING",
  },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(sampleUnits[0]);
  const [accepted, setAccepted] = useState(false);

  const handleViewDetails = (unit) => {
    setSelectedUnit(unit);
    setDrawerOpen(true);
  };

  const handleBookUnit = (unit) => {
    setSelectedUnit(unit);
    setModalOpen(true);
  };

  return (
    <div className="design-system">
      <Header
        brandName="STORAGEHUB"
        brandHref="#top"
        roleLabel="REFERENCE"
        avatarText="00"
        navLinks={[
          { label: "Design System", href: "#top", active: true },
          { label: "Browse Units", href: "#entities", active: false },
        ]}
      />

      <main id="top" style={{ paddingTop: "64px" }}>
        <section className="page-masthead">
          <div className="page-masthead__copy">
            <p className="eyebrow">00 / SHARED FOUNDATION</p>
            <h1>Design system & components.</h1>
            <p>
              The canonical visual language for all StorageHub desktop prototype
              screens.
            </p>
          </div>

          <div className="page-masthead__meta">
            <div className="page-masthead__number">00</div>
            <div>
              SWISS GRID
              <br />
              0 PX RADIUS
              <br />
              NO GRADIENTS
            </div>
          </div>
        </section>

        <div className="content-canvas shell">
          {/* Panel 01: Color tokens */}
          <section className="panel">
            <div className="panel__header">
              <h2>Color tokens</h2>
              <span className="panel__index">01</span>
            </div>
            <div className="panel__body">
              <div className="metric-grid">
                <div
                  className="metric"
                  style={{ background: "#000000", color: "#ffffff" }}
                >
                  <span className="metric__label">Ink</span>
                  <div className="metric__value">#000000</div>
                </div>
                <div
                  className="metric"
                  style={{ background: "#dc2626", color: "#ffffff" }}
                >
                  <span className="metric__label">Signal</span>
                  <div className="metric__value">#DC2626</div>
                </div>
                <div
                  className="metric"
                  style={{ background: "#f5f5f5", color: "#000000" }}
                >
                  <span className="metric__label">Neutral</span>
                  <div className="metric__value">#F5F5F5</div>
                </div>
                <div
                  className="metric"
                  style={{ background: "#ffffff", color: "#000000" }}
                >
                  <span className="metric__label">Surface</span>
                  <div className="metric__value">#FFFFFF</div>
                </div>
              </div>
            </div>
          </section>

          {/* Panel 02: Typography */}
          <section className="panel">
            <div className="panel__header">
              <h2>Typography</h2>
              <span className="panel__index">02</span>
            </div>
            <div className="panel__body">
              <p className="eyebrow">EYEBROW / 11 PX / 800</p>
              <h1
                style={{
                  font: "780 4rem / 0.95 var(--font-display)",
                  margin: "20px 0",
                }}
              >
                Operational clarity at every scale.
              </h1>
              <h2 style={{ font: "750 1.5rem var(--font-display)" }}>
                Section heading / Inter Tight
              </h2>
              <p>
                Body copy is set in Inter with restrained line length, direct
                language and clear hierarchy.
              </p>
            </div>
          </section>

          {/* Panel 03: Actions & states */}
          <section className="panel">
            <div className="panel__header">
              <h2>Actions & states</h2>
              <span className="panel__index">03</span>
            </div>
            <div className="panel__body">
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button>Primary action →</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="text">Text action</Button>
                <Button variant="danger">Delete</Button>
                <Button disabled>Disabled</Button>
                <Badge variant="state" tone="danger">
                  ATTENTION
                </Badge>
                <Badge variant="state">ACTIVE</Badge>
                <Badge variant="state" tone="muted">
                  ARCHIVED
                </Badge>
                <Badge tone="success">AVAILABLE</Badge>
                <Badge tone="warning">PENDING</Badge>
              </div>
            </div>
          </section>

          {/* Panel 04: Entity Cards (UnitCard) */}
          <section id="entities" className="panel">
            <div className="panel__header">
              <h2>Entity cards (UnitCard)</h2>
              <span className="panel__index">04</span>
            </div>
            <div className="panel__body">
              <div className="entity-contract">
                <div>
                  <strong>Storage Unit card contract</strong>
                  <span>
                    Code · type · size · zone · floor · access · availability ·
                    monthly rate
                  </span>
                </div>
                <code>units + unit_types + zones + policy_rules</code>
              </div>

              <div className="unit-grid">
                {sampleUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onViewDetails={handleViewDetails}
                    onBook={handleBookUnit}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Panel 05: General Cards */}
          <section className="panel">
            <div className="panel__header">
              <h2>Standard cards</h2>
              <span className="panel__index">05</span>
            </div>
            <div className="panel__body">
              <div className="grid grid--2">
                <Card
                  eyebrow="FACILITY"
                  title="Storage overview"
                  actions={<Badge tone="success">ONLINE</Badge>}
                >
                  <p>
                    Operational status of lockers, security gates and
                    temperature monitors across all zones.
                  </p>
                </Card>

                <Card
                  eyebrow="OCCUPANCY"
                  title="84% capacity"
                  actions={<Button variant="text">View map</Button>}
                >
                  <p>
                    168 of 200 units rented. 32 units available for immediate
                    customer check-in.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Panel 06: Shared record contract & Data table */}
          <section className="panel">
            <div className="panel__header">
              <h2>Shared record contract & Data table</h2>
              <span className="panel__index">06</span>
            </div>
            <div className="panel__body">
              <div className="stack" style={{ gap: "24px" }}>
                <article className="record-card">
                  <div className="record-card__head">
                    <div>
                      <p className="eyebrow">RENTAL</p>
                      <h2>RT-2026-0041</h2>
                    </div>
                    <Badge variant="state" tone="danger">
                      ACTIVE
                    </Badge>
                  </div>
                  <div className="record-grid">
                    <div className="record-field">
                      <span>Unit</span>
                      <strong>B-214</strong>
                    </div>
                    <div className="record-field">
                      <span>Customer</span>
                      <strong>Lan Anh</strong>
                    </div>
                    <div className="record-field">
                      <span>End date</span>
                      <strong>05 Oct 2026</strong>
                    </div>
                  </div>
                </article>

                <DataTable columns={columns} rows={rows} />
              </div>
            </div>
          </section>

          {/* Panel 07: Form controls */}
          <section className="panel">
            <div className="panel__header">
              <h2>Form controls</h2>
              <span className="panel__index">07</span>
            </div>
            <div className="panel__body">
              <div className="grid grid--2">
                <Input
                  label="Customer name"
                  placeholder="Nguyen Van A"
                  required
                />

                <Select
                  label="Facility floor"
                  options={[
                    { value: "", label: "Select floor" },
                    { value: "F1", label: "Floor 1 - Standard Units" },
                    { value: "F2", label: "Floor 2 - Climate Controlled" },
                  ]}
                  required
                />

                <Input
                  label="Unit code (with error state)"
                  defaultValue="INVALID-99"
                  error="Unit code is not recognized in current facility map"
                />

                <div className="field">
                  <span className="field__label">Agreement</span>
                  <div style={{ marginTop: "8px" }}>
                    <Checkbox
                      label="Customer signed rental terms & security deposit policy"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Textarea
                    label="Access & security notes"
                    placeholder="Record special badge ID or gate access permissions..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Panel 08: Overlays (Drawer & Modal) */}
          <section className="panel">
            <div className="panel__header">
              <h2>Overlays (Drawer & Modal)</h2>
              <span className="panel__index">08</span>
            </div>
            <div className="panel__body">
              <div className="cluster">
                <Button
                  variant="secondary"
                  onClick={() => setDrawerOpen(true)}
                >
                  Open Unit Details Drawer
                </Button>
                <Button onClick={() => setModalOpen(true)}>
                  Open Review Modal
                </Button>
              </div>
            </div>
          </section>

          {/* Panel 09: Rules */}
          <section className="panel">
            <div className="panel__header">
              <h2>Rules</h2>
              <span className="panel__index">09</span>
            </div>
            <div className="panel__body">
              <dl className="spec-list">
                <div className="spec-row">
                  <dt>Corner radius</dt>
                  <dd>0 px everywhere</dd>
                </div>
                <div className="spec-row">
                  <dt>Layout</dt>
                  <dd>12-column desktop grid</dd>
                </div>
                <div className="spec-row">
                  <dt>Color use</dt>
                  <dd>Red only for action and attention</dd>
                </div>
                <div className="spec-row">
                  <dt>Data naming</dt>
                  <dd>Matches ERD entities and enums</dd>
                </div>
                <div className="spec-row">
                  <dt>Language</dt>
                  <dd>English only</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Slide-in Side Drawer */}
      <Drawer
        open={drawerOpen}
        headerLabel="ENTITY OVERVIEW"
        onClose={() => setDrawerOpen(false)}
      >
        <p className="eyebrow">{selectedUnit.code} / TAN BINH DEPOT</p>
        <h2 style={{ margin: "4px 0 10px", font: "700 2.1rem / 1 var(--font-display)" }}>
          {selectedUnit.sizeM2} m² {selectedUnit.type}
        </h2>
        <p style={{ margin: "0 0 24px", color: "var(--color-secondary)" }}>
          Drawers preserve the parent page while showing a complete entity summary.
        </p>

        <dl className="spec-list">
          <div className="spec-row">
            <dt>Unit code</dt>
            <dd>{selectedUnit.code}</dd>
          </div>
          <div className="spec-row">
            <dt>Location</dt>
            <dd>
              {selectedUnit.zone}, floor {selectedUnit.floor}
            </dd>
          </div>
          <div className="spec-row">
            <dt>Area</dt>
            <dd>{selectedUnit.sizeM2} m²</dd>
          </div>
          <div className="spec-row">
            <dt>Access</dt>
            <dd>{selectedUnit.accessType}</dd>
          </div>
          <div className="spec-row">
            <dt>Monthly rent</dt>
            <dd>
              {new Intl.NumberFormat("vi-VN").format(selectedUnit.monthlyPrice)} ₫
            </dd>
          </div>
          <div className="spec-row">
            <dt>Status</dt>
            <dd>
              <Badge
                tone={
                  selectedUnit.availability === "soon" ? "muted" : "success"
                }
              >
                {selectedUnit.availability === "soon"
                  ? "Available soon"
                  : "Available"}
              </Badge>
            </dd>
          </div>
        </dl>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "28px",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setDrawerOpen(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setDrawerOpen(false);
              setModalOpen(true);
            }}
          >
            Configure reservation
          </Button>
        </div>
      </Drawer>

      {/* Review Modal */}
      <Modal
        open={modalOpen}
        title="Review the rental."
        confirmLabel="Continue"
        cancelLabel="Back"
        onConfirm={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
      >
        <p className="eyebrow" style={{ marginBottom: "8px" }}>
          {selectedUnit.code} / POLICY V3
        </p>
        <p style={{ margin: "0 0 20px", color: "var(--color-secondary)" }}>
          This preview uses the selected unit. No reservation is created in this
          design prototype.
        </p>

        <dl className="spec-list">
          <div className="spec-row">
            <dt>Storage Unit</dt>
            <dd>
              {selectedUnit.code} · {selectedUnit.sizeM2} m²
            </dd>
          </div>
          <div className="spec-row">
            <dt>Monthly rent</dt>
            <dd>
              {new Intl.NumberFormat("vi-VN").format(selectedUnit.monthlyPrice)} ₫
            </dd>
          </div>
          <div className="spec-row">
            <dt>Refundable deposit (10%)</dt>
            <dd>
              {new Intl.NumberFormat("vi-VN").format(
                Math.round(selectedUnit.monthlyPrice * 0.1),
              )}{" "}
              ₫
            </dd>
          </div>
        </dl>
      </Modal>
    </div>
  );
}