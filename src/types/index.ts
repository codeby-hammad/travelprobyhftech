// Every table in Supabase will have TypeScript types here
// This helps you catch bugs before they happen
export type UserRole = 'super_admin' | 'agency_admin' | 'agent' | 'accountant'
export type OrgPlan  = 'starter' | 'pro' | 'agency'

export type Organization = {
  id:         string
  name:       string
  slug:       string
  logo_url:   string | null
  plan:       OrgPlan
  is_active:  boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id:              string
  organization_id: string
  full_name:       string
  email:           string
  role:            UserRole
  avatar_url:      string | null
  is_active:       boolean
  created_at:      string
  updated_at:      string
}

// This is Profile + Organization joined — used in most pages
export type ProfileWithOrg = Profile & {
  organization: Organization
}

export type BookingStatus = 'inquiry' | 'quoted' | 'confirmed' | 'cancelled' | 'completed'

export type Client = {
  id:              string
  organization_id: string
  full_name:       string
  email:           string | null
  phone:           string | null
  passport_number: string | null
  passport_expiry: string | null
  nationality:     string | null
  date_of_birth:   string | null
  address:         string | null
  notes:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type Package = {
  id:              string
  organization_id: string
  name:            string
  description:     string | null
  destination:     string
  duration_days:   number
  base_price:      number
  currency:        string
  includes:        string[] | null
  excludes:        string[] | null
  is_active:       boolean
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type Booking = {
  id:              string
  organization_id: string
  booking_ref:     string
  client_id:       string
  package_id:      string | null
  agent_id:        string | null
  status:          BookingStatus
  travel_date:     string | null
  return_date:     string | null
  num_passengers:  number
  total_amount:    number
  paid_amount:     number
  currency:        string
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export type BookingWithDetails = Booking & {
  client:  Client
  package: Package | null
  agent:   Profile | null
}
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'online'
export type PaymentStatus = 'pending' | 'completed' | 'refunded'
export type SupplierType  = 'hotel' | 'airline' | 'transport' | 'visa' | 'insurance' | 'other'

export type Payment = {
  id:              string
  organization_id: string
  booking_id:      string
  amount:          number
  currency:        string
  method:          PaymentMethod
  status:          PaymentStatus
  reference_no:    string | null
  notes:           string | null
  paid_at:         string
  created_by:      string | null
  created_at:      string
}

export type Supplier = {
  id:              string
  organization_id: string
  name:            string
  type:            SupplierType
  contact_name:    string | null
  email:           string | null
  phone:           string | null
  country:         string | null
  city:            string | null
  notes:           string | null
  is_active:       boolean
  created_at:      string
  updated_at:      string
}

export type PackageType   = 'general' | 'umrah' | 'hajj' | 'ziarat' | 'tour'
export type SeatClass     = 'economy' | 'business' | 'first'
export type MealPlan      = 'room_only' | 'bed_breakfast' | 'half_board' | 'full_board'
export type UmrahType     = 'individual' | 'group' | 'family' | 'vip'
export type UmrahVisaType = 'umrah' | 'tourist' | 'ziarat' | 'multiple'

export type FlightDetail = {
  seat_no: import("react").JSX.Element
  id:              string
  organization_id: string
  booking_id:      string
  trip_type:       'outbound' | 'return'
  airline:         string | null
  flight_number:   string | null
  pnr:             string | null
  departure_city:  string | null
  arrival_city:    string | null
  departure_time:  string | null
  arrival_time:    string | null
  terminal:        string | null
  seat_class:      SeatClass
  baggage_kg:      number
  notes:           string | null
  created_at:      string
}

export type HotelDetail = {
  id:              string
  organization_id: string
  booking_id:      string
  city:            string
  hotel_name:      string
  stars:           number | null
  room_type:       string | null
  check_in:        string | null
  check_out:       string | null
  nights:          number | null
  confirmation_no: string | null
  distance_haram:  string | null
  meal_plan:       MealPlan
  notes:           string | null
  created_at:      string
}

export type UmrahDetail = {
  id:               string
  organization_id:  string
  booking_id:       string
  umrah_type:       UmrahType
  visa_type:        UmrahVisaType
  departure_city:   string
  maktab_number:    string | null
  group_leader:     string | null
  makkah_nights:    number
  madinah_nights:   number
  ziarat_makkah:    boolean
  ziarat_madinah:   boolean
  transport_type:   string
  ihram_point:      string | null
  special_requests: string | null
  created_at:       string
  updated_at:       string
}
export type VisaStatus = 
  | 'not_applied'
  | 'documents_collecting'
  | 'applied'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'expired'

export type VisaType =
  | 'umrah' | 'tourist' | 'business'
  | 'transit' | 'student' | 'work' | 'multiple'

export type VisaApplication = {
  id:               string
  organization_id:  string
  booking_id:       string
  client_id:        string
  visa_type:        VisaType
  destination:      string
  status:           VisaStatus
  applied_date:     string | null
  expected_date:    string | null
  approved_date:    string | null
  expiry_date:      string | null
  visa_number:      string | null
  rejection_reason: string | null
  embassy:          string | null
  fee_charged:      number
  fee_paid:         boolean
  notes:            string | null
  created_at:       string
  updated_at:       string
}

export type GroupBooking = {
  id:              string
  organization_id: string
  booking_id:      string
  group_name:      string
  group_leader_id: string | null
  total_pax:       number
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export type GroupPassenger = {
  id:               string
  organization_id:  string
  group_booking_id: string
  client_id:        string
  seat_number:      string | null
  room_sharing:     string | null
  paid_amount:      number
  total_amount:     number
  notes:            string | null
  created_at:       string
}
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type NotificationType = 'booking_confirmation' | 'payment_receipt' | 'travel_reminder' | 'invoice' | 'custom'
export type NotificationChannel = 'email' | 'whatsapp' | 'sms'

export type InvoiceItem = {
  id:          string
  invoice_id:  string
  description: string
  quantity:    number
  unit_price:  number
  total:       number
}

export type Invoice = {
  id:              string
  organization_id: string
  booking_id:      string
  invoice_number:  string
  status:          InvoiceStatus
  issue_date:      string
  due_date:        string | null
  subtotal:        number
  discount:        number
  tax_rate:        number
  tax_amount:      number
  total:           number
  currency:        string
  notes:           string | null
  terms:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type Notification = {
  id:              string
  organization_id: string
  booking_id:      string | null
  client_id:       string | null
  type:            NotificationType
  channel:         NotificationChannel
  recipient_email: string | null
  recipient_phone: string | null
  subject:         string | null
  body:            string
  status:          'pending' | 'sent' | 'failed'
  sent_at:         string | null
  error_message:   string | null
  created_by:      string | null
  created_at:      string
}
export type ExpenseCategory =
  | 'flight' | 'hotel' | 'visa' | 'transport'
  | 'guide'  | 'insurance' | 'food' | 'other'

export type BookingExpense = {
  id:              string
  organization_id: string
  booking_id:      string
  supplier_id:     string | null
  category:        ExpenseCategory
  description:     string
  amount:          number
  currency:        string
  is_paid:         boolean
  paid_date:       string | null
  reference_no:    string | null
  notes:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type BookingProfitSummary = {
  booking_id:     string
  organization_id: string
  booking_ref:    string
  selling_price:  number
  collected:      number
  currency:       string
  total_cost:     number
  gross_profit:   number
  profit_margin:  number
  expense_count:  number
  paid_costs:     number
  unpaid_costs:   number
}
export type SeatStatus     = 'available' | 'reserved' | 'sold' | 'returned' | 'expired'
export type SoldToType     = 'customer'  | 'sub_agent' | 'agency' | 'own_booking'
export type BatchStatus    = 'active'    | 'expired'   | 'sold_out' | 'cancelled'
export type TicketPaymentStatus  = 'pending'   | 'received'  | 'overdue'

export type TicketBatch = {
  id:              string
  organization_id: string
  batch_number:    string
  airline:         string
  flight_number:   string | null
  route_from:      string
  route_to:        string
  flight_date:     string
  return_date:     string | null
  seat_class:      SeatClass
  supplier_id:     string | null
  purchased_from:  string | null
  purchase_date:   string
  cost_per_seat:   number
  total_seats:     number
  currency:        string
  retail_price:    number
  agent_price:     number
  agency_price:    number
  status:          BatchStatus
  expiry_date:     string | null
  notes:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type TicketSeat = {
  id:              string
  organization_id: string
  batch_id:        string
  seat_number:     string | null
  pnr:             string | null
  status:          SeatStatus
  sold_to_type:    SoldToType | null
  client_id:       string | null
  sub_agent_id:    string | null
  booking_id:      string | null
  buyer_name:      string | null
  sold_price:      number | null
  sold_date:       string | null
  payment_method:  string | null
  payment_status:  TicketPaymentStatus
  notes:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type SubAgent = {
  id:               string
  organization_id:  string
  name:             string
  contact_person:   string | null
  phone:            string | null
  email:            string | null
  city:             string | null
  credit_limit:     number
  current_balance:  number
  discount_percent: number
  is_active:        boolean
  notes:            string | null
  created_at:       string
  updated_at:       string
}

export type TicketBatchSummary = TicketBatch & {
  seats_available:     number
  seats_reserved:      number
  seats_sold:          number
  seats_returned:      number
  seats_total_created: number
  total_investment:    number
  total_revenue:       number
  gross_profit:        number
  collected_revenue:   number
  pending_collection:  number
}
export type AccountType    = 'asset' | 'liability' | 'equity' | 'income' | 'expense'
export type EntryType      = 'debit' | 'credit'
export type PartyType      = 'client' | 'sub_agent' | 'supplier' | 'agency'
export type ReferenceType  = 'booking' | 'payment' | 'invoice' | 'ticket_sale' | 'expense' | 'manual' | 'opening'

export type Account = {
  id:              string
  organization_id: string
  code:            string
  name:            string
  type:            AccountType
  sub_type:        string | null
  is_system:       boolean
  is_active:       boolean
  opening_balance: number
  notes:           string | null
  created_at:      string
}

export type JournalEntry = {
  id:              string
  organization_id: string
  entry_number:    string
  entry_date:      string
  description:     string
  reference_type:  ReferenceType | null
  reference_id:    string | null
  total_amount:    number
  currency:        string
  is_posted:       boolean
  notes:           string | null
  created_by:      string | null
  created_at:      string
}

export type LedgerEntry = {
  id:               string
  organization_id:  string
  journal_entry_id: string
  account_id:       string | null
  party_type:       PartyType | null
  client_id:        string | null
  sub_agent_id:     string | null
  supplier_id:      string | null
  party_name:       string | null
  entry_type:       EntryType
  amount:           number
  currency:         string
  description:      string | null
  created_at:       string
}

export type PartyBalance = {
  party_type:  PartyType
  party_id:    string
  party_name:  string
  party_phone: string | null
  party_email: string | null
  organization_id: string
  total_debit:  number
  total_credit: number
  balance:      number
}
export type AgeCategory = 'adult' | 'child' | 'infant'
export type Gender      = 'male'  | 'female'

export type TicketPassenger = {
  id:              string
  organization_id: string
  batch_id:        string
  seat_id:         string | null
  full_name:       string
  passport_number: string | null
  nationality:     string | null
  date_of_birth:   string | null
  gender:          Gender | null
  age_category:    AgeCategory
  pnr:             string | null
  eticket_number:  string | null
  seat_number:     string | null
  ticket_price:    number
  currency:        string
  baggage_kg:      number
  group_sale_id:   string | null
  client_id:       string | null
  payment_status:  TicketPaymentStatus
  notes:           string | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type TicketGroupSale = {
  id:              string
  organization_id: string
  batch_id:        string
  group_ref:       string
  pnr:             string | null
  lead_client_id:  string | null
  buyer_name:      string | null
  buyer_phone:     string | null
  adult_count:     number
  child_count:     number
  infant_count:    number
  total_pax:       number
  total_amount:    number
  paid_amount:     number
  currency:        string
  payment_method:  string
  payment_status:  string
  notes:           string | null
  sale_date:       string
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export type BatchPricing = {
  id:           string
  batch_id:     string
  age_category: AgeCategory
  price:        number
  description:  string | null
}
export type ServiceType       = 'flight' | 'hotel' | 'visa' | 'transport' | 'guide' | 'insurance' | 'other'
export type InvoiceStatusType = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export type SupplierInvoice = {
  id:                  string
  organization_id:     string
  supplier_id:         string
  booking_id:          string | null
  batch_id:            string | null
  invoice_number:      string
  invoice_date:        string
  due_date:            string | null
  service_type:        ServiceType
  description:         string
  amount:              number
  paid_amount:         number
  currency:            string
  status:              InvoiceStatusType
  notes:               string | null
  attachment_url:      string | null
  created_by:          string | null
  created_at:          string
  updated_at:          string
}

export type SupplierPayment = {
  id:                  string
  organization_id:     string
  supplier_id:         string
  supplier_invoice_id: string | null
  payment_number:      string
  payment_date:        string
  amount:              number
  currency:            string
  payment_method:      string
  reference_no:        string | null
  bank_name:           string | null
  account_title:       string | null
  account_number:      string | null
  notes:               string | null
  created_by:          string | null
  created_at:          string
}
export type FlightLeg = {
  id:              string
  organization_id: string
  batch_id:        string | null
  seat_id:         string | null
  leg_number:      number
  airline:         string
  flight_number:   string | null
  departure_city:  string
  arrival_city:    string
  departure_time:  string | null
  arrival_time:    string | null
  terminal:        string | null
  layover_minutes: number | null
  created_at:      string
}