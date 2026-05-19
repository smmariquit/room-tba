<script lang="ts">
  import { queryStore, locationStore } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import {
    CornerRightUp,
    Users,
    Mail,
    Phone,
    Building2,
    ExternalLink,
    MapPin,
    BadgeCheck,
    CircleDollarSign,
    TriangleAlert,
  } from "@lucide/svelte";

  const { dorms } = getAppData();

  const dorm = $derived(
    dorms.find((d) => d.dorm_name === queryStore.queryValue),
  );

  const amenities = $derived<string[]>(() => {
    if (!dorm?.amenities) return [];
    try {
      return JSON.parse(dorm.amenities);
    } catch {
      return [];
    }
  });

  const genderLabel = $derived(
    dorm?.gender === "male"
      ? "Male-exclusive"
      : dorm?.gender === "female"
        ? "Female-exclusive"
        : "Co-ed",
  );

  const genderColor = $derived(
    dorm?.gender === "male"
      ? "hsl(210, 65%, 50%)"
      : dorm?.gender === "female"
        ? "hsl(330, 65%, 50%)"
        : "hsl(150, 55%, 40%)",
  );

  const googleMapsLink = $derived(
    dorm?.lat && dorm?.lon
      ? `https://www.google.com/maps?q=${dorm.lat},${dorm.lon}`
      : null,
  );

  /** Only show short_name when it's a real abbreviation, not just the first word */
  const showShortName = $derived(() => {
    if (!dorm?.short_name) return false;
    const first = dorm.dorm_name.split(/\s+/)[0].toLowerCase();
    return dorm.short_name.toLowerCase() !== first;
  });
</script>

<div class="dorm-result-wrapper">
  {#if dorm}
    <div class="dorm-header">
      <h2 class="dorm-title">{dorm.dorm_name}</h2>
      {#if showShortName()}
        <span class="dorm-short-name">{dorm.short_name}</span>
      {/if}
    </div>

    <div class="dorm-badges">
      {#if dorm.is_up_managed}
        <span class="badge up-badge">
          <BadgeCheck size={14} />
          UP-managed
        </span>
      {:else}
        <span class="badge private-badge">
          Private
        </span>
      {/if}
      <span class="badge gender-badge" style:--badge-color={genderColor}>
        <Users size={14} />
        {genderLabel}
      </span>
      {#if dorm.capacity}
        <span class="badge capacity-badge">
          <Building2 size={14} />
          {dorm.capacity} beds
        </span>
      {/if}
    </div>

    {#if dorm.price_range}
      <div class="price-row">
        <CircleDollarSign size={16} />
        <span class="price-value">{dorm.price_range}</span>
        {#if !dorm.is_up_managed}
          <span class="price-disclaimer">
            <TriangleAlert size={12} />
            Verify with owner
          </span>
        {/if}
      </div>
    {/if}

    {#if dorm.description}
      <p class="dorm-desc">{dorm.description}</p>
    {/if}

    <div class="dorm-actions">
      {#if dorm.lon && dorm.lat}
        <button
          class="action-btn directions-btn"
          onclick={() => {
            locationStore.requestLocation();
            locationStore.setDestination([dorm.lon ?? 0, dorm.lat ?? 0]);
          }}
        >
          <CornerRightUp size={16} />
          Directions
        </button>
      {/if}
      {#if googleMapsLink}
        <a
          href={googleMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          class="action-btn gmaps-btn"
        >
          <MapPin size={16} />
          Google Maps
        </a>
      {/if}
      {#if dorm.facebook_link}
        <a
          href={dorm.facebook_link}
          target="_blank"
          rel="noopener noreferrer"
          class="action-btn social-btn"
        >
          <ExternalLink size={16} />
          Facebook
        </a>
      {/if}
    </div>

    <hr class="dorm-divider" />

    <div class="dorm-details">
      <h3 class="section-title">Details</h3>

      {#if dorm.managing_office}
        <div class="detail-row">
          <Building2 size={16} />
          <div>
            <span class="detail-label">Managing Office</span>
            <span class="detail-value">{dorm.managing_office}</span>
          </div>
        </div>
      {/if}

      {#if dorm.contact_email}
        <div class="detail-row">
          <Mail size={16} />
          <div>
            <span class="detail-label">Email</span>
            <a
              href="mailto:{dorm.contact_email}"
              class="detail-value email-link"
            >
              {dorm.contact_email}
            </a>
          </div>
        </div>
      {/if}

      {#if dorm.contact_phone}
        <div class="detail-row">
          <Phone size={16} />
          <div>
            <span class="detail-label">Phone</span>
            <span class="detail-value">{dorm.contact_phone}</span>
          </div>
        </div>
      {/if}
    </div>

    {#if amenities().length > 0}
      <div class="dorm-amenities">
        <h3 class="section-title">Amenities</h3>
        <div class="amenities-grid">
          {#each amenities() as amenity}
            <span class="amenity-tag">{amenity}</span>
          {/each}
        </div>
      </div>
    {/if}

    <div class="dorm-footer">
      {#if dorm.is_up_managed}
        <a
          href="https://uplbosa.org"
          target="_blank"
          rel="noopener noreferrer"
          class="osa-link"
        >
          <ExternalLink size={14} />
          UPLB OSA Website
        </a>
      {:else}
        <div class="private-tip">
          <TriangleAlert size={14} />
          <span>Prices and details may change. Always verify in person or contact directly before committing.</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="no-results">Dorm not found.</div>
  {/if}
</div>

<style>
  .dorm-result-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    flex: 1 1 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: hsl(6, 63%, 48%) hsl(0, 0%, 98%);
  }

  .dorm-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dorm-title {
    font-size: 1.125rem;
    font-weight: bold;
    color: black;
    margin: 0;
    line-height: 1.3;
  }

  .dorm-short-name {
    font-size: 0.75rem;
    color: #7b1113;
    background-color: hsl(5, 53%, 95%);
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .dorm-badges {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .gender-badge {
    background-color: color-mix(in srgb, var(--badge-color) 15%, white);
    color: var(--badge-color);
  }

  .capacity-badge {
    background-color: hsl(0, 0%, 93%);
    color: #4f4f4f;
  }

  .up-badge {
    background-color: hsl(5, 53%, 93%);
    color: #7b1113;
  }

  .private-badge {
    background-color: hsl(210, 50%, 93%);
    color: hsl(210, 60%, 40%);
  }

  .price-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: #333;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .price-value {
    color: hsl(150, 45%, 35%);
  }

  .price-disclaimer {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6875rem;
    color: hsl(35, 80%, 45%);
    font-weight: 500;
  }

  .dorm-desc {
    font-size: 0.8125rem;
    color: #4f4f4f;
    margin: 0;
    line-height: 1.5;
  }

  .dorm-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    text-decoration: none;
    width: max-content;
  }

  .directions-btn {
    background-color: #7b1113;
    color: white;
  }

  .directions-btn:hover {
    background-color: #9a1517;
  }

  .gmaps-btn {
    background-color: hsl(210, 50%, 93%);
    color: hsl(210, 60%, 35%);
  }

  .gmaps-btn:hover {
    background-color: hsl(210, 50%, 87%);
  }

  .social-btn {
    background-color: hsl(220, 50%, 93%);
    color: hsl(220, 60%, 40%);
  }

  .social-btn:hover {
    background-color: hsl(220, 50%, 87%);
  }

  .dorm-divider {
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid #ececec;
  }

  .dorm-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #333;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: #666;
  }

  .detail-row > div {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: 0.6875rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .detail-value {
    font-size: 0.8125rem;
    color: #333;
  }

  .email-link {
    color: #7b1113;
    text-decoration: none;
  }

  .email-link:hover {
    text-decoration: underline;
  }

  .dorm-amenities {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .amenities-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .amenity-tag {
    padding: 0.25rem 0.625rem;
    background-color: hsl(0, 0%, 96%);
    border: 1px solid hsl(0, 0%, 90%);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    color: #555;
  }

  .dorm-footer {
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid #ececec;
  }

  .osa-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #7b1113;
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s;
  }

  .osa-link:hover {
    background-color: hsl(5, 53%, 95%);
  }

  .private-tip {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    font-size: 0.6875rem;
    color: hsl(35, 80%, 45%);
    line-height: 1.4;
    padding: 0.375rem 0;
  }

  .no-results {
    color: #666;
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem 0;
  }
</style>
