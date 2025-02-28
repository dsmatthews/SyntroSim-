import numpy as np
import matplotlib.pyplot as plt

# --- CONSTANTS AND DEFAULT VALUES ---
# Genetic Potential
GENETIC_POTENTIAL = 0.8  # Scaled 0-1

# Environmental Factors Defaults
LIGHT_INTENSITY = 1000  # µmol/m²/s (average in Gunalda)
LIGHT_DURATION = 13  # hours/day
LIGHT_WAVELENGTH = 0.9  # Scaled 0-1
TEMPERATURE = 25  # °C (average)
WATER_AVAILABILITY = 0.7  # Scaled 0-1
SOIL_PROPERTIES = 0.7  # Scaled 0-1 (pH: 5.5–6.5, Structure: 0.8, Salinity: 0.1 dS/m)
CO2_CONCENTRATION = 410  # ppm
HUMIDITY_RELATIVE = 0.7  # 70%
EDGE_LIGHT_INCREASE = 1.2  # +20% PAR
TEMP_FLUCTUATION = 0.9  # ±5°C scaled to 0-1 impact
HUMIDITY_GRADIENT = 0.9  # -10% humidity scaled to 0-1 impact

# Biotic Interactions Defaults
POLLINATORS = 0.7
SYMBIONTS = 0.8
PREDATORY_INSECTS = 0.5
PATHOGENS = 0.3
PESTS = 0.4
COMPETITION = 0.5  # Reduced to 0.71 after Competition^0.5
SEED_DISPERSERS = 0.7
SOIL_AERATORS = 0.5
PEST_PREDATORS = 0.6

# Fungal Network Defaults
FUNGAL_DIVERSITY = 350  # species
NETWORK_CONNECTIVITY = 0.6
RESOURCE_TRANSFER_RATE = 0.075  # 7.5% of plant carbon
ALLELO_TRANSPORT = 0.3
ALLELO_DEGRADATION = 0.4

# Allelopathic Effects Defaults
ALLELO_POSITIVE = 0.3
ALLELO_NEGATIVE = 0.1
ALLELO_COMPATIBILITY = 0.7

# Nutrient Availability Defaults
MYCORRHIZAL_UPTAKE = 0.7
NITROGEN_FIXATION = 75  # kg N/ha/year
PRUNED_BIOMASS_RATE = 3.5  # t/ha/year
ORGANIC_MATTER_INPUT = 7.5  # t/ha/year
DECOMPOSITION_RATE_BIOMASS = 0.75  # year^-1
NUTRIENT_RELEASE_COEFF_BIOMASS = 0.075  # g N/g biomass
SEED_FALL_RATE = 3000  # seeds/m²/year
DECOMPOSITION_RATE_WEED = 0.65  # year^-1
NUTRIENT_RELEASE_COEFF_WEED = 0.15  # g N/seed

# Syntropic Interventions Defaults
SPECIES_RICHNESS = 25
FUNCTIONAL_GROUP_LAYERING = 0.9
MYCORRHIZAL_COLONIZATION = 0.6
MICROBIAL_ACTIVITY = 0.6  # g CO₂/g soil/day
PATHOGEN_LOAD = 0.2
PIONEER_SPECIES = 0.6  # 60% of initial planting
CLIMAX_SPECIES = 0.2  # 20% of initial planting
TIME_LAG = 12  # months per transition
PRUNING_FREQUENCY = 3  # times/year
PLANTING_DENSITY_ADJUSTMENT = 0.15  # 15% change/year
OBSERVATION_ADAPTATION = 0.5

# Microclimate Defaults
CANOPY_SHADE = 0.3  # 30% light reduction
HUMIDITY_RETENTION = 0.1  # +10% humidity
WINDBREAK_EFFICACY = 0.4  # 40% wind speed reduction

# Stress Defaults
EXTERNAL_STRESS = 0.4
INVASIVE_COVER = 0.075  # 7.5%
COMPETITIVE_IMPACT = 0.2

# Aging and Developmental Defaults
T_MAX = 60  # months (5 years for simulation)
GERMINATION_STAGE = 0.5
VEGETATIVE_STAGE = 0.7
REPRODUCTIVE_STAGE = 0.9
SENESCENCE_STAGE = 0.3

# Carbon Cycling Defaults
CARBON_INPUT_BIOMASS = 3  # t C/ha/year
FUNGAL_STORAGE_EFFICIENCY = 0.55  # 55%
CLIMATE_RESILIENCE_FACTOR = 0.6

# --- HIERARCHICAL FUNCTIONS ---

# 1. Environmental Factors
def environmental_factor(t, light_intensity=LIGHT_INTENSITY, light_duration=LIGHT_DURATION,
                         light_wavelength=LIGHT_WAVELENGTH, temperature=TEMPERATURE,
                         water=WATER_AVAILABILITY, soil=SOIL_PROPERTIES,
                         co2=CO2_CONCENTRATION, humidity=HUMIDITY_RELATIVE):
    """Calculate the environmental factor E(t)."""
    light = light_intensity / 1200 * light_duration / 14 * light_wavelength  # Normalize light components
    temp = min(1.0, max(0.0, (temperature - 15) / (30 - 15)))  # Scale temperature to optimal range
    return light * temp * water * soil * (co2 / 420) * humidity

def microclimate_factor(t, edge_light=EDGE_LIGHT_INCREASE, temp_fluctuation=TEMP_FLUCTUATION,
                       humidity_gradient=HUMIDITY_GRADIENT):
    """Calculate the microclimate adjustment E_micro(t)."""
    return edge_light * temp_fluctuation * humidity_gradient

# 2. Biotic Interactions
def biotic_interactions(t, pollinators=POLLINATORS, symbionts=SYMBIONTS,
                        predatory_insects=PREDATORY_INSECTS, pathogens=PATHOGENS,
                        pests=PESTS, competition=COMPETITION):
    """Calculate the biotic interactions B(t)."""
    beneficial = pollinators * symbionts * predatory_insects
    antagonistic = pathogens * pests * (competition ** 0.5)
    return min(1.0, beneficial / max(0.01, antagonistic))

def faunal_interactions(t, seed_dispersers=SEED_DISPERSERS, soil_aerators=SOIL_AERATORS,
                        pest_predators=PEST_PREDATORS):
    """Calculate additional faunal contributions B_fauna(t)."""
    return seed_dispersers * soil_aerators * pest_predators

# 3. Fungal Network
def fungal_network(t, fungal_diversity=FUNGAL_DIVERSITY, network_connectivity=NETWORK_CONNECTIVITY,
                  resource_transfer_rate=RESOURCE_TRANSFER_RATE):
    """Calculate the fungal network F(t)."""
    diversity_factor = min(1.0, fungal_diversity / 500)  # Normalize diversity
    return diversity_factor * network_connectivity * resource_transfer_rate

def fungal_allelopathy(t, allelo_transport=ALLELO_TRANSPORT, allelo_degradation=ALLELO_DEGRADATION):
    """Calculate fungal mediation of allelopathy F_allelo(t)."""
    return allelo_transport * (1 - allelo_degradation)

# 4. Allelopathic Effects
def allelopathy(t, allelo_positive=ALLELO_POSITIVE, allelo_negative=ALLELO_NEGATIVE):
    """Calculate net allelopathic effects A_llelo(t)."""
    return max(-1.0, min(1.0, allelo_positive - allelo_negative))

# 5. Nutrient Availability
def nutrient_availability(t, mycorrhizal_uptake=MYCORRHIZAL_UPTAKE,
                         nitrogen_fixation=NITROGEN_FIXATION, biomass_factor=1.0):
    """Calculate in-system nutrient availability N(t)."""
    return biomass_factor * mycorrhizal_uptake * (nitrogen_fixation / 100)

def biomass_nutrient_contribution(t, pruned_biomass_rate=PRUNED_BIOMASS_RATE,
                                 organic_matter_input=ORGANIC_MATTER_INPUT,
                                 decomposition_rate=DECOMPOSITION_RATE_BIOMASS,
                                 nutrient_release_coeff=NUTRIENT_RELEASE_COEFF_BIOMASS,
                                 allelo_negative=ALLELO_NEGATIVE, allelo_positive=ALLELO_POSITIVE):
    """Calculate nutrient contribution from biomass N_biomass(t)."""
    biomass_factor = (pruned_biomass_rate * organic_matter_input * decomposition_rate * nutrient_release_coeff) / 40
    allelo_effect = (1 - allelo_negative) * (1 + allelo_positive)
    return biomass_factor * allelo_effect

def weed_nutrient_contribution(t, seed_fall_rate=SEED_FALL_RATE,
                              decomposition_rate=DECOMPOSITION_RATE_WEED,
                              nutrient_release_coeff=NUTRIENT_RELEASE_COEFF_WEED):
    """Calculate nutrient contribution from weed seeds N_weed(t)."""
    return (seed_fall_rate * decomposition_rate * nutrient_release_coeff) / 20

# 6. Syntropic Interventions
def plant_diversity(t, species_richness=SPECIES_RICHNESS, functional_group_layering=FUNCTIONAL_GROUP_LAYERING):
    """Calculate plant diversity M_diversity."""
    return min(1.0, species_richness / 30) * functional_group_layering

def biomass_recycling(t, pruned_biomass_rate=PRUNED_BIOMASS_RATE,
                     organic_matter_input=ORGANIC_MATTER_INPUT,
                     decomposition_rate=DECOMPOSITION_RATE_BIOMASS):
    """Calculate biomass recycling M_biomass."""
    return min(1.0, (pruned_biomass_rate * organic_matter_input) / (decomposition_rate * 10))

def successional_planning(t, pioneer_species=PIONEER_SPECIES, climax_species=CLIMAX_SPECIES,
                         time_lag=TIME_LAG, allelo_compatibility=ALLELO_COMPATIBILITY):
    """Calculate successional planning M_succession."""
    stage_transition = (pioneer_species * (1 - t / time_lag) + climax_species * (t / time_lag))  # Linear transition
    return stage_transition * allelo_compatibility

def microbiome_health(t, mycorrhizal_colonization=MYCORRHIZAL_COLONIZATION,
                     microbial_activity=MICROBIAL_ACTIVITY, pathogen_load=PATHOGEN_LOAD):
    """Calculate soil microbiome health M_microbiome."""
    return min(1.0, (mycorrhizal_colonization + microbial_activity) / max(0.01, pathogen_load))

def labor_intensity(t, pruning_frequency=PRUNING_FREQUENCY,
                   planting_density_adjustment=PLANTING_DENSITY_ADJUSTMENT,
                   observation_adaptation=OBSERVATION_ADAPTATION):
    """Calculate labor intensity L_labour(t)."""
    return min(1.0, (pruning_frequency / 4 + planting_density_adjustment + observation_adaptation) / 3)

def syntropic_interventions(t):
    """Calculate overall syntropic interventions H_syntropic(t)."""
    diversity = plant_diversity(t)
    biomass = biomass_recycling(t)
    succession = successional_planning(t)
    microbiome = microbiome_health(t)
    labor = labor_intensity(t)
    return (1 + diversity * biomass * succession * microbiome) * labor

# 7. Developmental Stage
def developmental_stage(t, t_max=T_MAX):
    """Calculate developmental stage D(t)."""
    if t < 6:  # Germination (first 6 months)
        return GERMINATION_STAGE
    elif t < 24:  # Vegetative (6-24 months)
        return VEGETATIVE_STAGE
    elif t < 48:  # Reproductive (24-48 months)
        return REPRODUCTIVE_STAGE
    else:  # Senescence (48-60 months)
        return SENESCENCE_STAGE

# 8. Stress Factor
def microclimate_effect(t, canopy_shade=CANOPY_SHADE, humidity_retention=HUMIDITY_RETENTION,
                       windbreak_efficacy=WINDBREAK_EFFICACY):
    """Calculate microclimate stress buffering M_microclimate."""
    return canopy_shade + humidity_retention + windbreak_efficacy

def stress_factor(t, external_stress=EXTERNAL_STRESS):
    """Calculate stress factor S(t)."""
    microclimate = microclimate_effect(t)
    stress = external_stress - microclimate
    return np.exp(-0.5 * max(0, stress))  # Lambda = 0.5 for sensitivity

def invasive_stress(t, invasive_cover=INVASIVE_COVER, competitive_impact=COMPETITIVE_IMPACT):
    """Calculate invasive species stress S_invasive(t)."""
    return 1 - (invasive_cover * competitive_impact)

# 9. Aging Factor
def aging_factor(t, t_max=T_MAX):
    """Calculate aging factor A(t)."""
    return max(0, 1 - t / t_max)

# 10. Carbon Cycling
def carbon_cycling(t, carbon_input=CARBON_INPUT_BIOMASS,
                  fungal_storage_efficiency=FUNGAL_STORAGE_EFFICIENCY,
                  climate_resilience_factor=CLIMATE_RESILIENCE_FACTOR):
    """Calculate carbon cycling C(t)."""
    return carbon_input * fungal_storage_efficiency * climate_resilience_factor

# --- MAIN FUNCTION: WORLD MODEL ---
def syntropic_world_model(t_max=T_MAX, time_step=1):
    """Simulate the syntropic system growth P(t) over time."""
    time_steps = int(t_max / time_step)
    time = np.arange(0, t_max + time_step, time_step)
    P = np.zeros(time_steps + 1)  # Growth trajectory
    carbon = np.zeros(time_steps + 1)  # Carbon sequestration trajectory

    P[0] = GENETIC_POTENTIAL  # Initial growth
    carbon[0] = 0  # Initial carbon

    # Integrate over time
    for i in range(1, time_steps + 1):
        t = time[i]
        # Compute each factor
        env = environmental_factor(t) * microclimate_factor(t)
        biotic = biotic_interactions(t) * faunal_interactions(t)
        fungal = fungal_network(t) * fungal_allelopathy(t)
        allelo = allelopathy(t)
        biomass_factor = biomass_recycling(t)  # For nutrient availability
        nutrients = nutrient_availability(t, biomass_factor=biomass_factor) * \
                   biomass_nutrient_contribution(t) * \
                   weed_nutrient_contribution(t)
        syntropic = syntropic_interventions(t)
        dev = developmental_stage(t)
        stress = stress_factor(t) * invasive_stress(t)
        aging = aging_factor(t)
        carbon_t = carbon_cycling(t)

        # Compute growth increment for this time step
        growth_increment = GENETIC_POTENTIAL * env * biotic * fungal * allelo * nutrients * \
                           syntropic * dev * stress * aging * carbon_t * time_step

        # Accumulate growth (integral approximation)
        P[i] = P[i-1] + growth_increment
        carbon[i] = carbon[i-1] + carbon_t * time_step

    return time, P, carbon

# --- RUN SIMULATION ---
time, growth, carbon = syntropic_world_model(t_max=60, time_step=1)

# --- PLOT RESULTS ---
plt.figure(figsize=(10, 6))
plt.subplot(2, 1, 1)
plt.plot(time, growth, label="Growth (P(t))", color="green")
plt.xlabel("Time (months)")
plt.ylabel("Growth (arbitrary units)")
plt.title("Syntropic System Growth and Carbon Sequestration")
plt.grid(True)
plt.legend()

plt.subplot(2, 1, 2)
plt.plot(time, carbon, label="Carbon Sequestration", color="brown")
plt.xlabel("Time (months)")
plt.ylabel("Carbon (t C/ha)")
plt.grid(True)
plt.legend()

plt.tight_layout()
plt.show()

