package com.app.config;

import com.app.entity.*;
import com.app.entity.enums.*;
import com.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final String SEED_PASSWORD = "Password@123";

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ProviderRepository providerRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final AddressRepository addressRepository;
    private final AvailabilityRepository availabilityRepository;
    private final AvailableSlotRepository slotRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final FavoriteRepository favoriteRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            log.info("Data seeding is disabled (app.seed.enabled=false)");
            return;
        }
        if (providerRepository.count() > 0) {
            log.info("Providers already exist, skipping data seeding");
            return;
        }

        log.info("Starting data seeding...");
        List<Client> clients = seedClients();
        List<Provider> providers = seedProviders();
        for (Provider provider : providers) {
            seedServices(provider);
            seedAvailabilityAndSlots(provider);
        }
        seedReservations(clients, providers);
        seedFavorites(clients, providers);
        log.info("Data seeding completed. Demo password for all seeded users: {}", SEED_PASSWORD);
    }

    // ─── Clients ───────────────────────────────────────────────────────────────

    private List<Client> seedClients() {
        List<Client> clients = new ArrayList<>();
        clients.add(seedClient("client1@appointment.app", "Alice", "Durand", "0601010101",
                "https://i.pravatar.cc/150?img=1",
                address("France", "Île-de-France", "Paris", "11e arrondissement", "12 Rue Oberkampf",
                        new BigDecimal("48.866667"), new BigDecimal("2.366667"))));
        clients.add(seedClient("client2@appointment.app", "Thomas", "Petit", "0602020202",
                "https://i.pravatar.cc/150?img=3",
                address("France", "Île-de-France", "Paris", "3e arrondissement", "8 Rue de Bretagne",
                        new BigDecimal("48.863300"), new BigDecimal("2.361600"))));
        clients.add(seedClient("client3@appointment.app", "Fatou", "Ndiaye", "0603030303",
                "https://i.pravatar.cc/150?img=9",
                address("France", "Île-de-France", "Paris", "18e arrondissement", "25 Rue des Martyrs",
                        new BigDecimal("48.880000"), new BigDecimal("2.340000"))));
        return clients;
    }

    private Client seedClient(String email, String firstName, String lastName, String phone,
                              String profilePhoto, Address address) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(SEED_PASSWORD))
                .role(Role.CLIENT)
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        user = userRepository.save(user);

        Client client = Client.builder()
                .user(user)
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .profilePhoto(profilePhoto)
                .address(address)
                .build();
        return clientRepository.save(client);
    }

    // ─── Providers ─────────────────────────────────────────────────────────────

    private List<Provider> seedProviders() {
        List<Provider> providers = new ArrayList<>();

        providers.add(seedProvider(
                "sophie.martin@appointment.app", "Sophie", "Martin", "0701010101",
                "Sophie Martin", "Coiffeuse professionnelle",
                "Coiffure & Style",
                "https://i.pravatar.cc/150?img=47",
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop",
                "Coiffure",
                address("France", "Île-de-France", "Paris", "9e arrondissement", "14 Rue de Châteaudun",
                        new BigDecimal("48.879500"), new BigDecimal("2.338600")),
                address("France", "Île-de-France", "Paris", "9e arrondissement", "14 Rue de Châteaudun",
                        new BigDecimal("48.879500"), new BigDecimal("2.338600"))));

        providers.add(seedProvider(
                "karim.benali@appointment.app", "Karim", "Benali", "0702020202",
                "Karim Benali", "Barbier expert",
                "Barbershop Premium",
                "https://i.pravatar.cc/150?img=12",
                "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80&auto=format&fit=crop",
                "Barbier",
                address("France", "Île-de-France", "Paris", "2e arrondissement", "5 Rue Montorgueil",
                        new BigDecimal("48.865200"), new BigDecimal("2.347300")),
                address("France", "Île-de-France", "Paris", "2e arrondissement", "5 Rue Montorgueil",
                        new BigDecimal("48.865200"), new BigDecimal("2.347300"))));

        providers.add(seedProvider(
                "lea.dubois@appointment.app", "Léa", "Dubois", "0703030303",
                "Léa Dubois", "Esthéticienne à domicile",
                "Institut de beauté Léa",
                "https://i.pravatar.cc/150?img=25",
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop",
                "Esthétique",
                address("France", "Île-de-France", "Paris", "10e arrondissement", "60 Rue du Faubourg Saint-Denis",
                        new BigDecimal("48.873000"), new BigDecimal("2.353600")),
                address("France", "Île-de-France", "Paris", "10e arrondissement", "60 Rue du Faubourg Saint-Denis",
                        new BigDecimal("48.873000"), new BigDecimal("2.353600"))));

        providers.add(seedProvider(
                "camille.nguyen@appointment.app", "Camille", "Nguyen", "0704040404",
                "Camille Nguyen", "Prothésiste ongulaire",
                "Nail Art Studio",
                "https://i.pravatar.cc/150?img=9",
                "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&q=80&auto=format&fit=crop",
                "Onglerie",
                address("France", "Île-de-France", "Paris", "12e arrondissement", "22 Rue de Charonne",
                        new BigDecimal("48.852000"), new BigDecimal("2.383000")),
                address("France", "Île-de-France", "Paris", "12e arrondissement", "22 Rue de Charonne",
                        new BigDecimal("48.852000"), new BigDecimal("2.383000"))));

        providers.add(seedProvider(
                "julien.moreau@appointment.app", "Julien", "Moreau", "0705050505",
                "Julien Moreau", "Coach sportif certifié",
                "Fit'Life Coaching",
                "https://i.pravatar.cc/150?img=32",
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80&auto=format&fit=crop",
                "Coaching sportif",
                address("France", "Île-de-France", "Paris", "15e arrondissement", "100 Rue de la Convention",
                        new BigDecimal("48.840000"), new BigDecimal("2.295000")),
                address("France", "Île-de-France", "Paris", "15e arrondissement", "100 Rue de la Convention",
                        new BigDecimal("48.840000"), new BigDecimal("2.295000"))));

        providers.add(seedProvider(
                "aicha.diallo@appointment.app", "Aïcha", "Diallo", "0706060606",
                "Aïcha Diallo", "Masseuse bien-être",
                "Zenitude Spa",
                "https://i.pravatar.cc/150?img=16",
                "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80&auto=format&fit=crop",
                "Bien-être",
                address("France", "Île-de-France", "Paris", "6e arrondissement", "3 Rue de Seine",
                        new BigDecimal("48.854000"), new BigDecimal("2.339000")),
                address("France", "Île-de-France", "Paris", "6e arrondissement", "3 Rue de Seine",
                        new BigDecimal("48.854000"), new BigDecimal("2.339000"))));

        providers.add(seedProvider(
                "paul.girard@appointment.app", "Dr Paul", "Girard", "0707070707",
                "Dr Paul Girard", "Chirurgien-dentiste",
                "Cabinet Dentaire Girard",
                "https://i.pravatar.cc/150?img=53",
                "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=80&auto=format&fit=crop",
                "Santé",
                address("France", "Île-de-France", "Paris", "17e arrondissement", "45 Rue de Tocqueville",
                        new BigDecimal("48.882000"), new BigDecimal("2.309000")),
                address("France", "Île-de-France", "Paris", "17e arrondissement", "45 Rue de Tocqueville",
                        new BigDecimal("48.882000"), new BigDecimal("2.309000"))));

        providers.add(seedProvider(
                "marie.laurent@appointment.app", "Marie", "Laurent", "0708080808",
                "Marie Laurent", "Photographe portrait",
                "Marie Laurent Photographie",
                "https://i.pravatar.cc/150?img=5",
                "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80&auto=format&fit=crop",
                "Photographie",
                address("France", "Île-de-France", "Paris", "20e arrondissement", "18 Rue de Belleville",
                        new BigDecimal("48.872000"), new BigDecimal("2.386000")),
                address("France", "Île-de-France", "Paris", "20e arrondissement", "18 Rue de Belleville",
                        new BigDecimal("48.872000"), new BigDecimal("2.386000"))));

        return providers;
    }

    private Provider seedProvider(String email, String firstName, String lastName, String phone,
                                  String displayName, String profileTitle, String bio,
                                  String profilePhoto, String coverPhoto, String category,
                                  Address personalAddress, Address serviceAddress) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(SEED_PASSWORD))
                .role(Role.PROVIDER)
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        user = userRepository.save(user);

        Provider provider = Provider.builder()
                .user(user)
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .displayName(displayName)
                .profileTitle(profileTitle)
                .bio(bio)
                .profilePhoto(profilePhoto)
                .coverPhoto(coverPhoto)
                .category(category)
                .isActive(true)
                .isVerified(true)
                .verificationStatus(VerificationStatus.APPROVED)
                .personalAddress(personalAddress)
                .serviceAddress(serviceAddress)
                .build();
        return providerRepository.save(provider);
    }

    // ─── Services ──────────────────────────────────────────────────────────────

    private void seedServices(Provider provider) {
        switch (provider.getCategory()) {
            case "Coiffure" -> {
                seedService(provider, "Coupe femme", 45, "35.00", "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop", "Coupe et coiffage personnalisés pour révéler votre style.");
                seedService(provider, "Coupe + brushing", 60, "45.00", "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80&auto=format&fit=crop", "Coupe suivie d'un brushing professionnel brillant.");
                seedService(provider, "Coloration", 90, "60.00", "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80&auto=format&fit=crop", "Coloration complète avec produits de qualité salon.");
            }
            case "Barbier" -> {
                seedService(provider, "Coupe homme", 30, "20.00", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80&auto=format&fit=crop", "Coupe moderne adaptée à votre morphologie.");
                seedService(provider, "Coupe + barbe", 45, "30.00", "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80&auto=format&fit=crop", "Coupe et taille de barbe au rasoir.");
                seedService(provider, "Rasage traditionnel", 30, "25.00", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80&auto=format&fit=crop", "Rasage à l'ancienne avec serviette chaude.");
            }
            case "Esthétique" -> {
                seedService(provider, "Soin du visage", 60, "50.00", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&auto=format&fit=crop", "Soin complet du visage pour une peau éclatante.");
                seedService(provider, "Épilation", 30, "25.00", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&auto=format&fit=crop", "Épilation à la cire douce pour une peau lisse.");
                seedService(provider, "Maquillage événementiel", 45, "40.00", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&auto=format&fit=crop", "Maquillage professionnel pour vos événements.");
            }
            case "Onglerie" -> {
                seedService(provider, "Manucure classique", 45, "25.00", "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80&auto=format&fit=crop", "Manucure complète avec soin des cuticules.");
                seedService(provider, "Pose de vernis semi-permanent", 60, "35.00", "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80&auto=format&fit=crop", "Pose de vernis semi-permanent tenue 3 semaines.");
                seedService(provider, "Nail art", 60, "40.00", "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80&auto=format&fit=crop", "Création d'ongles personnalisés et artistiques.");
            }
            case "Coaching sportif" -> {
                seedService(provider, "Séance coaching individuelle", 60, "55.00", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop", "Coaching personnalisé pour atteindre vos objectifs.");
                seedService(provider, "Programme fitness", 90, "70.00", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&auto=format&fit=crop", "Élaboration d'un programme d'entraînement sur mesure.");
                seedService(provider, "Coaching nutrition", 60, "60.00", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop", "Conseils nutritionnels adaptés à votre mode de vie.");
            }
            case "Bien-être" -> {
                seedService(provider, "Massage relaxant", 60, "50.00", "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80&auto=format&fit=crop", "Massage relaxant aux huiles essentielles.");
                seedService(provider, "Massage profond", 60, "60.00", "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&auto=format&fit=crop", "Massage des tissus profonds pour les tensions musculaires.");
                seedService(provider, "Réflexologie plantaire", 45, "40.00", "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&auto=format&fit=crop", "Réflexologie plantaire pour un bien-être global.");
            }
            case "Santé" -> {
                seedService(provider, "Consultation dentaire", 30, "40.00", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80&auto=format&fit=crop", "Examen complet et conseils personnalisés.");
                seedService(provider, "Détartrage", 45, "55.00", "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80&auto=format&fit=crop", "Détartrage et polissage des dents.");
                seedService(provider, "Blanchiment dentaire", 60, "150.00", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80&auto=format&fit=crop", "Blanchiment des dents en cabinet.");
            }
            case "Photographie" -> {
                seedService(provider, "Séance portrait", 60, "80.00", "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&q=80&auto=format&fit=crop", "Séance portrait individuelle en studio ou extérieur.");
                seedService(provider, "Séance couple / famille", 90, "120.00", "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80&auto=format&fit=crop", "Séance photo couple ou famille avec retouches.");
                seedService(provider, "Shooting professionnel", 120, "180.00", "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&auto=format&fit=crop", "Shooting pour professionnels et marques.");
            }
            default -> { }
        }
    }

    private void seedService(Provider provider, String name, int durationMinutes, String price,
                             String photoUrl, String description) {
        ProviderService service = ProviderService.builder()
                .provider(provider)
                .name(name)
                .description(description)
                .photoUrl(photoUrl)
                .durationMinutes(durationMinutes)
                .price(new BigDecimal(price))
                .depositEnabled(false)
                .isActive(true)
                .build();
        providerServiceRepository.save(service);
    }

    // ─── Availability & Slots ──────────────────────────────────────────────────

    private void seedAvailabilityAndSlots(Provider provider) {
        LocalDate today = LocalDate.now();
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(18, 0);
        int intervalMinutes = 60;

        for (int i = -10; i <= 14; i++) {
            LocalDate date = today.plusDays(i);
            if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }

            Availability availability = Availability.builder()
                    .provider(provider)
                    .date(date)
                    .dayOfWeek(com.app.entity.enums.DayOfWeek.valueOf(date.getDayOfWeek().name()))
                    .startTime(startTime)
                    .endTime(endTime)
                    .intervalMinutes(intervalMinutes)
                    .isActive(true)
                    .build();
            availability = availabilityRepository.save(availability);

            for (LocalTime slotStart = startTime; slotStart.isBefore(endTime); slotStart = slotStart.plusMinutes(intervalMinutes)) {
                AvailableSlot slot = AvailableSlot.builder()
                        .provider(provider)
                        .availability(availability)
                        .date(date)
                        .startTime(slotStart)
                        .endTime(slotStart.plusMinutes(intervalMinutes))
                        .status(SlotStatus.AVAILABLE)
                        .build();
                slotRepository.save(slot);
            }
        }
    }

    // ─── Reservations, Payments & Reviews ─────────────────────────────────────

    private void seedReservations(List<Client> clients, List<Provider> providers) {
        LocalDate today = LocalDate.now();
        Client alice = clients.get(0);
        Client thomas = clients.get(1);

        // Alice – completed booking with Sophie
        seedReservation(alice, providers.get(0), today.minusDays(5), LocalTime.of(10, 0),
                ReservationStatus.COMPLETED, true, "Merci pour cette superbe coupe !");
        // Alice – completed booking with Karim
        seedReservation(alice, providers.get(1), today.minusDays(3), LocalTime.of(14, 0),
                ReservationStatus.COMPLETED, true, "Très professionnel, je recommande !");
        // Alice – upcoming confirmed booking with Léa
        seedReservation(alice, providers.get(2), today.plusDays(1), LocalTime.of(11, 0),
                ReservationStatus.CONFIRMED, true, "J'ai hâte de venir !");
        // Alice – pending booking with Camille
        seedReservation(alice, providers.get(3), today.plusDays(2), LocalTime.of(15, 0),
                ReservationStatus.PENDING, false, "Je voudrais un rendez-vous le matin si possible.");

        // Thomas – completed booking with Aïcha
        seedReservation(thomas, providers.get(5), today.minusDays(7), LocalTime.of(16, 0),
                ReservationStatus.COMPLETED, true, "Excellent massage, merci !");
        // Thomas – completed booking with Dr Girard
        seedReservation(thomas, providers.get(6), today.minusDays(2), LocalTime.of(9, 0),
                ReservationStatus.COMPLETED, true, "Très à l'écoute.");
    }

    private void seedReservation(Client client, Provider provider, LocalDate date, LocalTime startTime,
                                 ReservationStatus status, boolean withPayment, String clientMessage) {
        List<ProviderService> services = providerServiceRepository.findActiveByProviderId(provider.getId());
        if (services.isEmpty()) {
            return;
        }
        ProviderService service = services.get(0);

        AvailableSlot slot = slotRepository.findByProviderIdAndDate(provider.getId(), date).stream()
                .filter(s -> s.getStartTime().equals(startTime) && s.getStatus() == SlotStatus.AVAILABLE)
                .findFirst()
                .map(existing -> {
                    existing.setStatus(SlotStatus.BOOKED);
                    existing.setService(service);
                    return slotRepository.save(existing);
                })
                .orElseGet(() -> slotRepository.save(AvailableSlot.builder()
                        .provider(provider)
                        .availability(null)
                        .service(service)
                        .date(date)
                        .startTime(startTime)
                        .endTime(startTime.plusMinutes(service.getDurationMinutes()))
                        .status(SlotStatus.BOOKED)
                        .build()));

        Reservation reservation = Reservation.builder()
                .client(client)
                .provider(provider)
                .service(service)
                .slot(slot)
                .status(status)
                .clientMessage(clientMessage)
                .depositRequired(false)
                .reminderSent(true)
                .build();
        reservation = reservationRepository.save(reservation);

        if (withPayment) {
            Payment payment = Payment.builder()
                    .reservation(reservation)
                    .amount(service.getPrice())
                    .method(PaymentMethod.STRIPE)
                    .status(PaymentStatus.SUCCESS)
                    .stripePaymentIntentId("pi_seed_" + reservation.getId())
                    .build();
            paymentRepository.save(payment);
        }

        if (status == ReservationStatus.COMPLETED) {
            Review review = Review.builder()
                    .client(client)
                    .provider(provider)
                    .reservation(reservation)
                    .rating((short) (4 + Math.abs(date.getDayOfMonth() % 2)))
                    .comment(clientMessage)
                    .isVisible(true)
                    .build();
            reviewRepository.save(review);
        }
    }

    // ─── Favorites ─────────────────────────────────────────────────────────────

    private void seedFavorites(List<Client> clients, List<Provider> providers) {
        Client alice = clients.get(0);
        favoriteRepository.save(Favorite.builder().client(alice).provider(providers.get(0)).build());
        favoriteRepository.save(Favorite.builder().client(alice).provider(providers.get(1)).build());
        favoriteRepository.save(Favorite.builder().client(alice).provider(providers.get(5)).build());
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Address address(String country, String region, String city, String district,
                            String addressLine, BigDecimal latitude, BigDecimal longitude) {
        return addressRepository.save(Address.builder()
                .country(country)
                .region(region)
                .city(city)
                .district(district)
                .addressLine(addressLine)
                .latitude(latitude)
                .longitude(longitude)
                .build());
    }
}
